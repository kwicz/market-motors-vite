"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.AuthUtils = exports.PERMISSIONS = exports.UserRole = void 0;
exports.hasHigherOrEqualRole = hasHigherOrEqualRole;
exports.isValidRole = isValidRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// User roles enum
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
// Permissions for each role
exports.PERMISSIONS = {
    [UserRole.USER]: ['view_cars', 'view_car_details'],
    [UserRole.ADMIN]: [
        'view_cars',
        'view_car_details',
        'create_car',
        'update_car',
        'delete_car',
        'manage_inventory',
        'view_admin_dashboard',
    ],
    [UserRole.SUPER_ADMIN]: [
        'view_cars',
        'view_car_details',
        'create_car',
        'update_car',
        'delete_car',
        'manage_inventory',
        'view_admin_dashboard',
        'create_user',
        'update_user',
        'delete_user',
        'manage_users',
        'manage_roles',
        'view_system_settings',
    ],
};
// Authentication utilities
class AuthUtils {
    static getJWTSecret() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return secret;
    }
    static getJWTRefreshSecret() {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
        }
        return secret;
    }
    // Hash password
    static async hashPassword(password) {
        const saltRounds = 12;
        return bcryptjs_1.default.hash(password, saltRounds);
    }
    // Verify password
    static async verifyPassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    // Generate access token
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.getJWTSecret(), {
            expiresIn: this.JWT_EXPIRES_IN,
        });
    }
    // Generate refresh token
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.getJWTRefreshSecret(), {
            expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        });
    }
    // Verify access token
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.getJWTSecret());
        }
        catch (error) {
            return null;
        }
    }
    // Verify refresh token
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.getJWTRefreshSecret());
        }
        catch (error) {
            return null;
        }
    }
    // Check if user has permission
    static hasPermission(userRole, permission) {
        return exports.PERMISSIONS[userRole].includes(permission);
    }
    // Check if user has any of the specified permissions
    static hasAnyPermission(userRole, permissions) {
        return permissions.some((permission) => this.hasPermission(userRole, permission));
    }
    // Check if user has all specified permissions
    static hasAllPermissions(userRole, permissions) {
        return permissions.every((permission) => this.hasPermission(userRole, permission));
    }
    // Get user permissions
    static getUserPermissions(userRole) {
        return [...exports.PERMISSIONS[userRole]];
    }
    // Calculate token expiration date
    static getTokenExpirationDate(expiresIn) {
        const now = new Date();
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('Invalid expiration format');
        }
        const [, amount, unit] = match;
        const value = parseInt(amount, 10);
        switch (unit) {
            case 's':
                return new Date(now.getTime() + value * 1000);
            case 'm':
                return new Date(now.getTime() + value * 60 * 1000);
            case 'h':
                return new Date(now.getTime() + value * 60 * 60 * 1000);
            case 'd':
                return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
            default:
                throw new Error('Invalid time unit');
        }
    }
}
exports.AuthUtils = AuthUtils;
AuthUtils.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
AuthUtils.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
// Role hierarchy helper
exports.ROLE_HIERARCHY = {
    [UserRole.USER]: 0,
    [UserRole.ADMIN]: 1,
    [UserRole.SUPER_ADMIN]: 2,
};
function hasHigherOrEqualRole(userRole, requiredRole) {
    return exports.ROLE_HIERARCHY[userRole] >= exports.ROLE_HIERARCHY[requiredRole];
}
function isValidRole(role) {
    return Object.values(UserRole).includes(role);
}
//# sourceMappingURL=auth.js.map