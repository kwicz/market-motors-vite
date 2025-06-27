import crypto from 'crypto';
import { eq, and, lt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../lib/db';
import {
  users,
  passwordResetTokens,
  emailVerificationTokens,
} from '../../lib/db/schema';
import { EmailService } from './emailService';
import { logger } from '../utils/logger';

export class PasswordResetService {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getTokenExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + this.TOKEN_EXPIRY_HOURS);
    return expiration;
  }

  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        return {
          success: true,
          message:
            'If an account with that email exists, we have sent a password reset link.',
        };
      }

      const userData = user[0];
      if (!userData.isActive) {
        return {
          success: false,
          message: 'Account is disabled. Please contact support.',
        };
      }

      const resetToken = this.generateToken();
      const expiresAt = this.getTokenExpiration();

      // Invalidate existing tokens
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.userId, userData.id));

      // Create new token
      await db.insert(passwordResetTokens).values({
        userId: userData.id,
        token: resetToken,
        expiresAt,
        isUsed: false,
      });

      const emailSent = await EmailService.sendPasswordResetEmail(
        userData.email,
        resetToken
      );

      return {
        success: emailSent,
        message: emailSent
          ? 'If an account with that email exists, we have sent a password reset link.'
          : 'Failed to send password reset email. Please try again later.',
      };
    } catch (error) {
      logger.error(
        'Password reset request error',
        error instanceof Error ? error : new Error(String(error)),
        {
          service: 'PasswordResetService',
          operation: 'requestPasswordReset',
          email: email,
        }
      );
      return {
        success: false,
        message: 'An error occurred while processing your request.',
      };
    }
  }

  async validateResetToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    message: string;
  }> {
    try {
      const resetToken = await db
        .select({
          userId: passwordResetTokens.userId,
          expiresAt: passwordResetTokens.expiresAt,
        })
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.isUsed, false)
          )
        )
        .limit(1);

      if (resetToken.length === 0) {
        return { valid: false, message: 'Invalid or expired reset token.' };
      }

      // Check if token is expired
      if (new Date() > resetToken[0].expiresAt) {
        return { valid: false, message: 'Reset token has expired.' };
      }

      return {
        valid: true,
        userId: resetToken[0].userId,
        message: 'Token is valid.',
      };
    } catch (error) {
      logger.error(
        'Token validation error',
        error instanceof Error ? error : new Error(String(error)),
        {
          service: 'PasswordResetService',
          operation: 'validateResetToken',
          token: token.substring(0, 8) + '...',
        }
      );
      return {
        valid: false,
        message: 'An error occurred while validating the token.',
      };
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const tokenValidation = await this.validateResetToken(token);
      if (!tokenValidation.valid || !tokenValidation.userId) {
        return { success: false, message: tokenValidation.message };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db
        .update(users)
        .set({ passwordHash: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, tokenValidation.userId));

      await db
        .update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.token, token));

      return {
        success: true,
        message: 'Password has been reset successfully.',
      };
    } catch (error) {
      logger.error(
        'Password reset error',
        error instanceof Error ? error : new Error(String(error)),
        {
          service: 'PasswordResetService',
          operation: 'resetPassword',
          token: token.substring(0, 8) + '...',
        }
      );
      return {
        success: false,
        message: 'An error occurred while resetting your password.',
      };
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const expiredTokens = await db
        .select({ id: passwordResetTokens.id })
        .from(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, now));

      if (expiredTokens.length > 0) {
        await db
          .delete(passwordResetTokens)
          .where(lt(passwordResetTokens.expiresAt, now));
        logger.info('Cleaned up expired password reset tokens', {
          service: 'PasswordResetService',
          operation: 'cleanupExpiredTokens',
          count: expiredTokens.length,
        });
      }
    } catch (error) {
      logger.error(
        'Token cleanup error',
        error instanceof Error ? error : new Error(String(error)),
        {
          service: 'PasswordResetService',
          operation: 'cleanupExpiredTokens',
        }
      );
    }
  }
}

export const passwordResetService = new PasswordResetService();
export default passwordResetService;
