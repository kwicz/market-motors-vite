"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerificationTokens = exports.passwordResetTokens = exports.sessions = exports.cars = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const cuid2_1 = require("@paralleldrive/cuid2");
// Users table for authentication and authorization
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .$defaultFn(() => (0, cuid2_1.createId)()),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    username: (0, pg_core_1.text)('username'),
    role: (0, pg_core_1.text)('role').notNull().default('user'), // 'user', 'admin', 'super_admin'
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
// Cars table for vehicle inventory
exports.cars = (0, pg_core_1.pgTable)('cars', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .$defaultFn(() => (0, cuid2_1.createId)()),
    make: (0, pg_core_1.text)('make').notNull(),
    model: (0, pg_core_1.text)('model').notNull(),
    year: (0, pg_core_1.integer)('year').notNull(),
    price: (0, pg_core_1.decimal)('price', { precision: 10, scale: 2 }).notNull(),
    mileage: (0, pg_core_1.integer)('mileage').notNull(),
    color: (0, pg_core_1.text)('color').notNull(),
    fuelType: (0, pg_core_1.text)('fuel_type').notNull(),
    transmission: (0, pg_core_1.text)('transmission').notNull(),
    condition: (0, pg_core_1.text)('condition').notNull(),
    category: (0, pg_core_1.text)('category').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    features: (0, pg_core_1.jsonb)('features').$type().notNull().default([]),
    images: (0, pg_core_1.jsonb)('images').$type().notNull().default([]),
    thumbnail: (0, pg_core_1.text)('thumbnail').notNull(),
    inStock: (0, pg_core_1.boolean)('in_stock').notNull().default(true),
    isFeatured: (0, pg_core_1.boolean)('is_featured').notNull().default(false),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
// Sessions table for JWT token management
exports.sessions = (0, pg_core_1.pgTable)('sessions', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    refreshToken: (0, pg_core_1.text)('refresh_token').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
// Password reset tokens table
exports.passwordResetTokens = (0, pg_core_1.pgTable)('password_reset_tokens', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    isUsed: (0, pg_core_1.boolean)('is_used').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
// Email verification tokens table
exports.emailVerificationTokens = (0, pg_core_1.pgTable)('email_verification_tokens', {
    id: (0, pg_core_1.uuid)('id')
        .primaryKey()
        .$defaultFn(() => (0, cuid2_1.createId)()),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    email: (0, pg_core_1.text)('email').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    isUsed: (0, pg_core_1.boolean)('is_used').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=schema.js.map