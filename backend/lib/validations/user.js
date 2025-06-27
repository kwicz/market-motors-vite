"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetSchema = exports.passwordResetRequestSchema = exports.refreshTokenSchema = exports.userUpdateSchema = exports.userStatusUpdateSchema = exports.userRoleUpdateSchema = exports.adminUserCreationSchema = exports.passwordChangeSchema = exports.userProfileUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
const auth_1 = require("../auth");
// User registration schema
exports.userRegistrationSchema = zod_1.z
    .object({
    email: zod_1.z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required')
        .max(255, 'Email must be less than 255 characters'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    confirmPassword: zod_1.z.string(),
    username: zod_1.z
        .string()
        .min(2, 'Username must be at least 2 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes')
        .optional(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
// User login schema
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
    rememberMe: zod_1.z.boolean().optional().default(false),
});
// User profile update schema
exports.userProfileUpdateSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(2, 'Username must be at least 2 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes')
        .optional(),
    email: zod_1.z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required')
        .max(255, 'Email must be less than 255 characters')
        .optional(),
});
// Password change schema
exports.passwordChangeSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    confirmNewPassword: zod_1.z.string(),
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ['confirmNewPassword'],
});
// Admin user creation schema (for super admin)
exports.adminUserCreationSchema = zod_1.z
    .object({
    email: zod_1.z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required')
        .max(255, 'Email must be less than 255 characters'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    confirmPassword: zod_1.z.string(),
    username: zod_1.z
        .string()
        .min(2, 'Username must be at least 2 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes')
        .optional(),
    role: zod_1.z.enum([auth_1.UserRole.ADMIN, auth_1.UserRole.SUPER_ADMIN], {
        errorMap: () => ({ message: 'Please select a valid role' }),
    }),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
// User role update schema (for super admin)
exports.userRoleUpdateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    role: zod_1.z.enum([auth_1.UserRole.USER, auth_1.UserRole.ADMIN, auth_1.UserRole.SUPER_ADMIN], {
        errorMap: () => ({ message: 'Please select a valid role' }),
    }),
});
// User status update schema (for admin/super admin)
exports.userStatusUpdateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    isActive: zod_1.z.boolean(),
});
// User profile update schema (for user themselves or super admin)
exports.userUpdateSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required')
        .max(255, 'Email must be less than 255 characters')
        .optional(),
    username: zod_1.z
        .string()
        .min(2, 'Username must be at least 2 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes')
        .optional(),
    currentPassword: zod_1.z.string().optional(),
    newPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
        .optional(),
});
// Refresh token schema
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
// Password reset request schema
exports.passwordResetRequestSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required'),
});
// Password reset schema
exports.passwordResetSchema = zod_1.z
    .object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
//# sourceMappingURL=user.js.map