import express from 'express';
import { eq, and, desc, count, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../lib/db';
import { users } from '../../lib/db/schema';
import {
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  authenticate,
} from '../middleware/auth';
import { AuthUtils, UserRole } from '../../lib/auth';
import {
  adminUserCreationSchema,
  userRoleUpdateSchema,
  userStatusUpdateSchema,
  userUpdateSchema,
} from '../../lib/validations/user';
import {
  asyncHandler,
  sendSuccess,
  sendPaginatedResponse,
  NotFoundError,
  ValidationError,
  ConflictError,
  DatabaseError,
} from '../middleware/error';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = express.Router();

// Query parameters schema for user listing
const userListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z
    .enum(['createdAt', 'email', 'username', 'role'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Get all users (super admin only) with pagination, filtering, and search
router.get(
  '/',
  asyncHandler(authenticate),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const query = userListQuerySchema.parse(req.query);
    const { page, limit, search, role, status, sortBy, sortOrder } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError(
        'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.'
      );
    }

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`)
        )
      );
    }

    // Role filter
    if (role) {
      conditions.push(eq(users.role, role));
    }

    // Status filter
    if (status) {
      conditions.push(eq(users.isActive, status === 'active'));
    }

    // Combine conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const totalCount = totalCountResult[0]?.count || 0;

    // Get users with pagination
    const usersResult = await db
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
      .where(whereClause)
      .orderBy(sortOrder === 'desc' ? desc(users[sortBy]) : users[sortBy])
      .limit(limit)
      .offset(offset);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    const filters = {
      search: search || null,
      role: role || null,
      status: status || null,
      sortBy,
      sortOrder,
    };

    sendPaginatedResponse(
      res,
      usersResult,
      pagination,
      'Users retrieved successfully',
      filters
    );
  })
);

// Get user by ID (super admin or user themselves)
router.get(
  '/:id',
  asyncHandler(authenticate),
  requireOwnershipOrAdmin('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    const user = await db
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
      .where(eq(users.id, validatedId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, user[0], 'User retrieved successfully');
  })
);

// Create new user (super admin only)
router.post(
  '/',
  asyncHandler(authenticate),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const validatedData = adminUserCreationSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(validatedData.password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: validatedData.email,
        passwordHash: hashedPassword,
        username: validatedData.username,
        role: validatedData.role,
        isActive: true, // Default to active for admin-created users
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (newUser.length === 0) {
      throw new DatabaseError('Failed to create user');
    }

    sendSuccess(res, newUser[0], 'User created successfully', 201);
  })
);

// Update user (super admin or user themselves)
router.put(
  '/:id',
  asyncHandler(authenticate),
  requireOwnershipOrAdmin('id'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    const validatedData = userUpdateSchema.parse(req.body);

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, validatedId))
      .limit(1);

    if (existingUser.length === 0) {
      throw new NotFoundError('User');
    }

    // Check for email conflicts if email is being updated
    if (validatedData.email && validatedData.email !== existingUser[0].email) {
      const emailExists = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.email, validatedData.email), eq(users.id, validatedId))
        )
        .limit(1);

      if (emailExists.length > 0) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.username) updateData.username = validatedData.username;
    if (validatedData.newPassword) {
      updateData.passwordHash = await AuthUtils.hashPassword(
        validatedData.newPassword
      );
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, validatedId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (updatedUser.length === 0) {
      throw new DatabaseError('Failed to update user');
    }

    sendSuccess(res, updatedUser[0], 'User updated successfully');
  })
);

// Update user role (super admin only)
router.patch(
  '/:id/role',
  asyncHandler(authenticate),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    const validatedData = userRoleUpdateSchema.parse(req.body);

    // Prevent super admin from changing their own role
    if (
      req.user!.id === validatedId &&
      req.user!.role === UserRole.SUPER_ADMIN
    ) {
      throw new ValidationError('Super admin cannot change their own role');
    }

    const updatedUser = await db
      .update(users)
      .set({
        role: validatedData.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, validatedId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (updatedUser.length === 0) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, updatedUser[0], 'User role updated successfully');
  })
);

// Update user status (super admin only)
router.patch(
  '/:id/status',
  asyncHandler(authenticate),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    const validatedData = userStatusUpdateSchema.parse(req.body);

    // Prevent super admin from deactivating themselves
    if (
      req.user!.id === validatedId &&
      req.user!.role === UserRole.SUPER_ADMIN &&
      !validatedData.isActive
    ) {
      throw new ValidationError(
        'Super admin cannot deactivate their own account'
      );
    }

    const updatedUser = await db
      .update(users)
      .set({
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, validatedId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (updatedUser.length === 0) {
      throw new NotFoundError('User');
    }

    const statusMessage = validatedData.isActive ? 'activated' : 'deactivated';
    sendSuccess(res, updatedUser[0], `User ${statusMessage} successfully`);
  })
);

// Delete user (super admin only)
router.delete(
  '/:id',
  asyncHandler(authenticate),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    // Prevent super admin from deleting themselves
    if (
      req.user!.id === validatedId &&
      req.user!.role === UserRole.SUPER_ADMIN
    ) {
      throw new ValidationError('Super admin cannot delete their own account');
    }

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, validatedId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
      });

    if (deletedUser.length === 0) {
      throw new NotFoundError('User');
    }

    sendSuccess(res, null, 'User deleted successfully');
  })
);

// Get user statistics (super admin only)
router.get(
  '/stats/overview',
  asyncHandler(authenticate),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    // Get total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get active users
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Get users by role
    const usersByRoleResult = await db
      .select({ role: users.role, count: count() })
      .from(users)
      .groupBy(users.role);

    const usersByRole = usersByRoleResult.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>);

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.createdAt, thirtyDaysAgo));
    const recentUsers = recentUsersResult[0]?.count || 0;

    const data = {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: {
        user: usersByRole.user || 0,
        admin: usersByRole.admin || 0,
        super_admin: usersByRole.super_admin || 0,
      },
      recentUsers,
    };

    sendSuccess(res, data, 'User statistics retrieved successfully');
  })
);

// Get current user's profile
router.get(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    sendSuccess(res, user, 'Profile retrieved successfully');
  })
);

// Update current user's profile (username only)
router.put(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      throw new ValidationError('Username is required');
    }
    const [updatedUser] = await db
      .update(users)
      .set({ username, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }
    sendSuccess(res, updatedUser, 'Profile updated successfully');
  })
);

// Enable/setup 2FA: generate secret and QR code
router.post(
  '/me/2fa/setup',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    // Generate a TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Market Motors (${req.user!.email})`,
    });
    // Save the base32 secret to the user (but do not enable 2FA yet)
    await db
      .update(users)
      .set({ twoFactorSecret: secret.base32, updatedAt: new Date() })
      .where(eq(users.id, userId));
    // Generate QR code data URL
    const otpauthUrl = secret.otpauth_url!;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    res.json({ secret: secret.base32, otpauthUrl, qrCodeDataUrl });
  })
);

// Verify 2FA code and enable 2FA
router.post(
  '/me/2fa/verify',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      throw new ValidationError('2FA token is required');
    }
    // Get user's secret
    const [user] = await db
      .select({ twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user || !user.twoFactorSecret) {
      throw new NotFoundError('2FA secret not found');
    }
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) {
      throw new ValidationError('Invalid 2FA token');
    }
    // Enable 2FA
    await db
      .update(users)
      .set({ twoFactorEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
    sendSuccess(res, null, 'Two-factor authentication enabled');
  })
);

// Disable 2FA
router.post(
  '/me/2fa/disable',
  asyncHandler(authenticate),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    sendSuccess(res, null, 'Two-factor authentication disabled');
  })
);

export default router;
