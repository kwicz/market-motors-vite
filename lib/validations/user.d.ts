import { z } from 'zod';
import { UserRole } from '../auth';
export declare const userRegistrationSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}>, {
    email: string;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}>;
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe: boolean;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export declare const userProfileUpdateSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    username?: string | undefined;
}, {
    email?: string | undefined;
    username?: string | undefined;
}>;
export declare const passwordChangeSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmNewPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>;
export declare const adminUserCreationSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<[UserRole.ADMIN, UserRole.SUPER_ADMIN]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}, {
    email: string;
    role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}>, {
    email: string;
    role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}, {
    email: string;
    role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
    password: string;
    confirmPassword: string;
    username?: string | undefined;
}>;
export declare const userRoleUpdateSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodEnum<[UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]>;
}, "strip", z.ZodTypeAny, {
    role: UserRole;
    userId: string;
}, {
    role: UserRole;
    userId: string;
}>;
export declare const userStatusUpdateSchema: z.ZodObject<{
    userId: z.ZodString;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    userId: string;
}, {
    isActive: boolean;
    userId: string;
}>;
export declare const userUpdateSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    currentPassword: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    username?: string | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
}, {
    email?: string | undefined;
    username?: string | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    password: string;
    confirmPassword: string;
}, {
    token: string;
    password: string;
    confirmPassword: string;
}>, {
    token: string;
    password: string;
    confirmPassword: string;
}, {
    token: string;
    password: string;
    confirmPassword: string;
}>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type AdminUserCreationInput = z.infer<typeof adminUserCreationSchema>;
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
//# sourceMappingURL=user.d.ts.map