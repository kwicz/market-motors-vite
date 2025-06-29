import express from 'express';
import { z } from 'zod';
import { passwordResetService } from '../services/passwordResetService';
import {
  asyncHandler,
  sendSuccess,
  ValidationError,
} from '../middleware/error';

const router = express.Router();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * POST /api/password-reset/request
 * Request password reset email
 */
router.post(
  '/request',
  asyncHandler(async (req, res) => {
    const { email } = requestResetSchema.parse(req.body);

    const result = await passwordResetService.requestPasswordReset(email);

    sendSuccess(res, null, result.message);
  })
);

/**
 * POST /api/password-reset/validate
 * Validate password reset token
 */
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { token } = validateTokenSchema.parse(req.body);

    const result = await passwordResetService.validateResetToken(token);

    sendSuccess(res, { valid: result.valid }, result.message);
  })
);

/**
 * POST /api/password-reset/reset
 * Reset password using token
 */
router.post(
  '/reset',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const result = await passwordResetService.resetPassword(token, newPassword);

    if (!result.success) {
      throw new ValidationError(result.message);
    }

    sendSuccess(res, null, result.message);
  })
);

export default router;
