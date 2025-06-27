export declare enum UserRole {
    USER = "user",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export declare const PERMISSIONS: {
    readonly user: readonly ["view_cars", "view_car_details"];
    readonly admin: readonly ["view_cars", "view_car_details", "create_car", "update_car", "delete_car", "manage_inventory", "view_admin_dashboard"];
    readonly super_admin: readonly ["view_cars", "view_car_details", "create_car", "update_car", "delete_car", "manage_inventory", "view_admin_dashboard", "create_user", "update_user", "delete_user", "manage_users", "manage_roles", "view_system_settings"];
};
export type Permission = (typeof PERMISSIONS)[UserRole.USER | UserRole.ADMIN | UserRole.SUPER_ADMIN][number];
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
    iat?: number;
    exp?: number;
}
export declare class AuthUtils {
    private static getJWTSecret;
    private static getJWTRefreshSecret;
    private static readonly JWT_EXPIRES_IN;
    private static readonly JWT_REFRESH_EXPIRES_IN;
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string;
    static verifyAccessToken(token: string): JWTPayload | null;
    static verifyRefreshToken(token: string): RefreshTokenPayload | null;
    static hasPermission(userRole: UserRole, permission: Permission): boolean;
    static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean;
    static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean;
    static getUserPermissions(userRole: UserRole): Permission[];
    static getTokenExpirationDate(expiresIn: string): Date;
}
export declare const ROLE_HIERARCHY: {
    readonly user: 0;
    readonly admin: 1;
    readonly super_admin: 2;
};
export declare function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean;
export declare function isValidRole(role: string): role is UserRole;
//# sourceMappingURL=auth.d.ts.map