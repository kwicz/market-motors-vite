import express, { Router } from 'express';
import { db } from '../../lib/db';
import { users, sessions } from '../../lib/db/schema';
import { emailVerificationTokens } from '../../lib/db/schema';
import { AuthUtils, UserRole } from '../../lib/auth';
import {
  userRegistrationSchema,
  userLoginSchema,
  refreshTokenSchema,
  passwordChangeSchema,
} from '../../lib/validations/user';
import { eq, and } from 'drizzle-orm';
import { asyncHandler } from '../middleware/error';
import {
  sendSuccess,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  DatabaseError,
} from '../middleware/error';
import { authenticate } from '../middleware/auth';

export const router: Router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const validatedData = userRegistrationSchema.parse(req.body);
    const { email, password, username } = validatedData;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        username,
        role: UserRole.USER,
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      });

    if (!newUser) {
      throw new DatabaseError('Failed to create user');
    }

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as UserRole,
    });

    const refreshToken = AuthUtils.generateRefreshToken({
      userId: newUser.id,
      sessionId: crypto.randomUUID(),
    });

    // Store session
    const expiresAt = AuthUtils.getTokenExpirationDate(
      process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    );

    await db.insert(sessions).values({
      userId: newUser.id,
      token: accessToken,
      refreshToken,
      expiresAt,
    });

    sendSuccess(
      res,
      {
        user: newUser,
        accessToken,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  })
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const validatedData = userLoginSchema.parse(req.body);
    const { email, password, rememberMe } = validatedData;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError(
        'Account is deactivated. Please contact support.'
      );
    }

    // Verify password
    const isValidPassword = await AuthUtils.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const sessionId = crypto.randomUUID();
    const accessToken = AuthUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    const refreshTokenExpiresIn = rememberMe
      ? '30d'
      : process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const refreshToken = AuthUtils.generateRefreshToken({
      userId: user.id,
      sessionId,
    });

    // Store session
    const expiresAt = AuthUtils.getTokenExpirationDate(refreshTokenExpiresIn);

    await db.insert(sessions).values({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
    });

    // Return user data without password
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    sendSuccess(
      res,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      'Login successful'
    );
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    // Verify refresh token
    const payload = AuthUtils.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find session
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, payload.userId),
          eq(sessions.refreshToken, refreshToken)
        )
      )
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired or invalid');
    }

    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new access token
    const newAccessToken = AuthUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    // Update session with new token
    await db
      .update(sessions)
      .set({ token: newAccessToken })
      .where(eq(sessions.id, session.id));

    sendSuccess(
      res,
      {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
        },
      },
      'Token refreshed successfully'
    );
  })
);

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post(
  '/logout',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Find and delete session
    const deletedSession = await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.token, token)))
      .returning({ id: sessions.id });

    if (deletedSession.length === 0) {
      throw new NotFoundError('Session not found');
    }

    sendSuccess(res, null, 'Logged out successfully');
  })
);

/**
 * POST /api/auth/logout-all
 * Logout user from all devices
 */
router.post(
  '/logout-all',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // Delete all sessions for the user
    const deletedSessions = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId))
      .returning({ id: sessions.id });

    sendSuccess(
      res,
      {
        sessionsTerminated: deletedSessions.length,
      },
      'Logged out from all devices successfully'
    );
  })
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const user = req.user!;

    // Get fresh user data from database
    const [currentUser] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    sendSuccess(res, currentUser, 'User information retrieved successfully');
  })
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const validatedData = passwordChangeSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;
    const userId = req.user!.id;

    // Get current user with password hash
    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthUtils.verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await AuthUtils.hashPassword(newPassword);

    // Update password
    const updatedUser = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (updatedUser.length === 0) {
      throw new DatabaseError('Failed to update password');
    }

    // Invalidate all sessions except current one
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.substring(7);

    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          currentToken ? eq(sessions.token, currentToken) : undefined
        )
      );

    sendSuccess(res, null, 'Password changed successfully');
  })
);

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      throw new ValidationError('Verification token is required');
    }

    // Find verification token
    const [verification] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);

    if (!verification) {
      throw new NotFoundError('Invalid or expired verification token');
    }
    if (verification.isUsed) {
      throw new ConflictError('Verification token has already been used');
    }
    if (verification.expiresAt < new Date()) {
      throw new ValidationError('Verification token has expired');
    }

    // Mark user as verified
    const updated = await db
      .update(users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(users.id, verification.userId))
      .returning({ id: users.id });

    if (updated.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ isUsed: true })
      .where(eq(emailVerificationTokens.id, verification.id));

    sendSuccess(res, null, 'Email verified successfully');
  })
);
