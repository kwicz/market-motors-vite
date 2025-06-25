import { db } from './index';
import { users } from './schema';
import { AuthUtils, UserRole } from '../auth';
import { eq } from 'drizzle-orm';

// Default super admin user configuration
const DEFAULT_SUPER_ADMIN = {
  email: 'admin@marketmotors.com',
  password: 'SuperAdmin123!',
  username: 'superadmin',
  role: UserRole.SUPER_ADMIN as const,
};

/**
 * Seeds the database with initial data
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, DEFAULT_SUPER_ADMIN.email))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log('✅ Super admin user already exists, skipping creation');
      return;
    }

    // Hash the default password
    const hashedPassword = await AuthUtils.hashPassword(
      DEFAULT_SUPER_ADMIN.password
    );

    // Create super admin user
    const [superAdmin] = await db
      .insert(users)
      .values({
        email: DEFAULT_SUPER_ADMIN.email,
        passwordHash: hashedPassword,
        username: DEFAULT_SUPER_ADMIN.username,
        role: DEFAULT_SUPER_ADMIN.role,
        isActive: true,
      })
      .returning();

    console.log('✅ Super admin user created successfully:');
    console.log(`   Email: ${DEFAULT_SUPER_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_SUPER_ADMIN.password}`);
    console.log(`   Role: ${DEFAULT_SUPER_ADMIN.role}`);
    console.log(
      '   ⚠️  IMPORTANT: Change the default password after first login!'
    );

    // You can add more seed data here, such as:
    // - Sample car inventory
    // - Additional admin users
    // - Default categories, etc.

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Creates additional admin users (for development/testing)
 */
export async function createAdminUser(
  email: string,
  password: string,
  username?: string,
  role: UserRole = UserRole.ADMIN
) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Hash the password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
        username,
        role,
        isActive: true,
      })
      .returning();

    console.log(`✅ Admin user created: ${email} (${role})`);
    return newUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

/**
 * Resets the super admin password (for recovery)
 */
export async function resetSuperAdminPassword(newPassword: string) {
  try {
    // Hash the new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update super admin password
    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.email, DEFAULT_SUPER_ADMIN.email))
      .returning();

    if (!updatedUser) {
      throw new Error('Super admin user not found');
    }

    console.log('✅ Super admin password reset successfully');
    return updatedUser;
  } catch (error) {
    console.error('❌ Error resetting super admin password:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
