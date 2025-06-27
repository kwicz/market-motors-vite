import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and, desc, asc, count, gte, lte, like, sql } from 'drizzle-orm';
import { db, testConnection, closeConnection } from '../index';
import {
  users,
  cars,
  sessions,
  passwordResetTokens,
  emailVerificationTokens,
} from '../schema';
import type { User, Car } from '../schema';

// Interface for database column information
interface ColumnInfo extends Record<string, unknown> {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

// Interface for foreign key information
interface ForeignKeyInfo extends Record<string, unknown> {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

// Test data
const testUser = {
  email: 'test@example.com',
  passwordHash: '$2b$10$test.hash.here',
  username: 'testuser',
  role: 'user' as const,
  isActive: true,
};

const testCar = {
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  price: '25000.00',
  mileage: 15000,
  color: 'Blue',
  fuelType: 'Gasoline',
  transmission: 'Automatic',
  condition: 'Excellent',
  category: 'Sedan',
  description: 'Test car description',
  features: ['Air Conditioning', 'Bluetooth', 'Backup Camera'],
  images: ['image1.jpg', 'image2.jpg'],
  thumbnail: 'thumbnail.jpg',
  inStock: true,
  isFeatured: false,
};

describe('Database Connection Tests', () => {
  beforeAll(async () => {
    // Ensure database connection is working
    const isConnected = await testConnection();
    expect(isConnected).toBe(true);
  });

  afterAll(async () => {
    await closeConnection();
  });

  it('should connect to database successfully', async () => {
    const result = await testConnection();
    expect(result).toBe(true);
  });

  it('should execute basic SQL queries', async () => {
    const result = await db.execute(sql`SELECT 1 as test`);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ test: 1 });
  });
});

describe('Schema Validation Tests', () => {
  beforeAll(async () => {
    await testConnection();
  });

  afterAll(async () => {
    await closeConnection();
  });

  it('should validate users table schema', async () => {
    // Test table exists and has correct structure
    const result = await db.execute<ColumnInfo>(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    const columns = result;
    expect(columns).toHaveLength(8);

    // Check required columns exist
    const columnNames = columns.map((col: ColumnInfo) => col.column_name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  it('should validate cars table schema', async () => {
    const result = await db.execute<ColumnInfo>(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      ORDER BY ordinal_position
    `);

    const columns = result;
    expect(columns.length).toBeGreaterThan(15);

    const columnNames = columns.map((col: ColumnInfo) => col.column_name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('make');
    expect(columnNames).toContain('model');
    expect(columnNames).toContain('year');
    expect(columnNames).toContain('price');
    expect(columnNames).toContain('mileage');
    expect(columnNames).toContain('features');
    expect(columnNames).toContain('images');
  });

  it('should validate foreign key constraints', async () => {
    const result = await db.execute<ForeignKeyInfo>(sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('cars', 'sessions', 'password_reset_tokens', 'email_verification_tokens')
    `);

    expect(result.length).toBeGreaterThan(0);

    // Check cars -> users foreign key
    const carsForeignKey = result.find(
      (row: ForeignKeyInfo) =>
        row.table_name === 'cars' && row.foreign_table_name === 'users'
    );
    expect(carsForeignKey).toBeDefined();
  });
});

describe('Users Table CRUD Operations', () => {
  let createdUserId: string;

  beforeAll(async () => {
    await testConnection();
  });

  afterAll(async () => {
    // Clean up test data
    if (createdUserId) {
      await db.delete(users).where(eq(users.id, createdUserId));
    }
    await closeConnection();
  });

  beforeEach(async () => {
    // Clean up any existing test user
    await db.delete(users).where(eq(users.email, testUser.email));
  });

  it('should create a new user', async () => {
    const [newUser] = await db.insert(users).values(testUser).returning();

    expect(newUser).toBeDefined();
    expect(newUser.email).toBe(testUser.email);
    expect(newUser.username).toBe(testUser.username);
    expect(newUser.role).toBe(testUser.role);
    expect(newUser.isActive).toBe(true);
    expect(newUser.id).toBeDefined();
    expect(newUser.createdAt).toBeInstanceOf(Date);
    expect(newUser.updatedAt).toBeInstanceOf(Date);

    createdUserId = newUser.id;
  });

  it('should read user by id', async () => {
    // First create a user
    const [createdUser] = await db.insert(users).values(testUser).returning();
    createdUserId = createdUser.id;

    // Then read it back
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, createdUser.id));

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(testUser.email);
    expect(foundUser.id).toBe(createdUser.id);
  });

  it('should read user by email', async () => {
    const [createdUser] = await db.insert(users).values(testUser).returning();
    createdUserId = createdUser.id;

    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUser.email));

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(testUser.email);
  });

  it('should update user', async () => {
    const [createdUser] = await db.insert(users).values(testUser).returning();
    createdUserId = createdUser.id;

    const updatedUsername = 'updateduser';
    const [updatedUser] = await db
      .update(users)
      .set({ username: updatedUsername })
      .where(eq(users.id, createdUser.id))
      .returning();

    expect(updatedUser.username).toBe(updatedUsername);
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
      createdUser.updatedAt.getTime()
    );
  });

  it('should delete user', async () => {
    const [createdUser] = await db.insert(users).values(testUser).returning();

    await db.delete(users).where(eq(users.id, createdUser.id));

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, createdUser.id));

    expect(foundUsers).toHaveLength(0);
  });

  it('should enforce unique email constraint', async () => {
    await db.insert(users).values(testUser).returning();

    await expect(
      db.insert(users).values(testUser).returning()
    ).rejects.toThrow();
  });

  it('should enforce not null constraints', async () => {
    await expect(
      db
        .insert(users)
        .values({
          email: undefined,
          passwordHash: undefined,
          username: 'test',
          role: 'user',
          isActive: true,
        } as any)
        .returning()
    ).rejects.toThrow();
  });
});

describe('Cars Table CRUD Operations', () => {
  let testUserId: string;
  let createdCarId: string;

  beforeAll(async () => {
    await testConnection();

    // Create a test user for foreign key reference
    const [user] = await db.insert(users).values(testUser).returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (createdCarId) {
      await db.delete(cars).where(eq(cars.id, createdCarId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    await closeConnection();
  });

  beforeEach(async () => {
    // Clean up any existing test cars
    await db.delete(cars).where(eq(cars.make, testCar.make));
  });

  it('should create a new car', async () => {
    const carWithUserId = { ...testCar, userId: testUserId };
    const [newCar] = await db.insert(cars).values(carWithUserId).returning();

    expect(newCar).toBeDefined();
    expect(newCar.make).toBe(testCar.make);
    expect(newCar.model).toBe(testCar.model);
    expect(newCar.year).toBe(testCar.year);
    expect(newCar.price).toBe(testCar.price);
    expect(newCar.features).toEqual(testCar.features);
    expect(newCar.images).toEqual(testCar.images);
    expect(newCar.userId).toBe(testUserId);

    createdCarId = newCar.id;
  });

  it('should read cars with filtering', async () => {
    const carWithUserId = { ...testCar, userId: testUserId };
    const [createdCar] = await db
      .insert(cars)
      .values(carWithUserId)
      .returning();
    createdCarId = createdCar.id;

    // Filter by make
    const toyotaCars = await db
      .select()
      .from(cars)
      .where(eq(cars.make, 'Toyota'));

    expect(toyotaCars.length).toBeGreaterThan(0);
    expect(toyotaCars[0].make).toBe('Toyota');

    // Filter by year range
    const recentCars = await db.select().from(cars).where(gte(cars.year, 2020));

    expect(recentCars.length).toBeGreaterThan(0);
  });

  it('should sort cars by different fields', async () => {
    // Create multiple test cars
    const cars1 = {
      ...testCar,
      model: 'Camry',
      year: 2020,
      userId: testUserId,
    };
    const cars2 = {
      ...testCar,
      model: 'Corolla',
      year: 2023,
      userId: testUserId,
    };

    await db.insert(cars).values([cars1, cars2]);

    // Sort by year descending
    const sortedByYear = await db
      .select()
      .from(cars)
      .where(eq(cars.make, 'Toyota'))
      .orderBy(desc(cars.year));

    expect(sortedByYear[0].year).toBeGreaterThanOrEqual(
      sortedByYear[1]?.year || 0
    );

    // Sort by model ascending
    const sortedByModel = await db
      .select()
      .from(cars)
      .where(eq(cars.make, 'Toyota'))
      .orderBy(asc(cars.model));

    expect(sortedByModel[0].model <= sortedByModel[1]?.model).toBe(true);
  });

  it('should update car information', async () => {
    const carWithUserId = { ...testCar, userId: testUserId };
    const [createdCar] = await db
      .insert(cars)
      .values(carWithUserId)
      .returning();
    createdCarId = createdCar.id;

    const updatedPrice = '30000.00';
    const [updatedCar] = await db
      .update(cars)
      .set({ price: updatedPrice, isFeatured: true })
      .where(eq(cars.id, createdCar.id))
      .returning();

    expect(updatedCar.price).toBe(updatedPrice);
    expect(updatedCar.isFeatured).toBe(true);
  });

  it('should handle JSON fields correctly', async () => {
    const carWithComplexData = {
      ...testCar,
      userId: testUserId,
      features: ['GPS', 'Heated Seats', 'Sunroof', 'Premium Sound'],
      images: ['front.jpg', 'back.jpg', 'interior.jpg', 'engine.jpg'],
    };

    const [createdCar] = await db
      .insert(cars)
      .values(carWithComplexData)
      .returning();
    createdCarId = createdCar.id;

    expect(createdCar.features).toEqual(carWithComplexData.features);
    expect(createdCar.images).toEqual(carWithComplexData.images);
    expect(Array.isArray(createdCar.features)).toBe(true);
    expect(Array.isArray(createdCar.images)).toBe(true);
  });

  it('should search cars by text', async () => {
    const carWithUserId = {
      ...testCar,
      userId: testUserId,
      description: 'Excellent condition Toyota Camry with low mileage',
    };
    const [createdCar] = await db
      .insert(cars)
      .values(carWithUserId)
      .returning();
    createdCarId = createdCar.id;

    // Search in description
    const searchResults = await db
      .select()
      .from(cars)
      .where(like(cars.description, '%excellent%'));

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].description.toLowerCase()).toContain('excellent');
  });

  it('should count cars correctly', async () => {
    const carWithUserId = { ...testCar, userId: testUserId };
    await db.insert(cars).values(carWithUserId);

    const [result] = await db
      .select({ count: count() })
      .from(cars)
      .where(eq(cars.make, 'Toyota'));

    expect(result.count).toBeGreaterThan(0);
  });
});

describe('Complex Query Operations', () => {
  let testUserId: string;

  beforeAll(async () => {
    await testConnection();

    // Create test user
    const [user] = await db.insert(users).values(testUser).returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await db.delete(cars).where(eq(cars.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await closeConnection();
  });

  it('should perform joins between users and cars', async () => {
    // Create a car linked to the user
    const carWithUserId = { ...testCar, userId: testUserId };
    await db.insert(cars).values(carWithUserId);

    // Query with join
    const results = await db
      .select({
        carId: cars.id,
        carMake: cars.make,
        carModel: cars.model,
        userEmail: users.email,
        userName: users.username,
      })
      .from(cars)
      .innerJoin(users, eq(cars.userId, users.id))
      .where(eq(users.id, testUserId));

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].userEmail).toBe(testUser.email);
    expect(results[0].carMake).toBe(testCar.make);
  });

  it('should handle complex filtering with multiple conditions', async () => {
    // Create multiple test cars
    const car1 = {
      ...testCar,
      model: 'Camry',
      year: 2020,
      price: '20000.00',
      userId: testUserId,
    };
    const car2 = {
      ...testCar,
      model: 'Corolla',
      year: 2023,
      price: '25000.00',
      userId: testUserId,
    };
    const car3 = {
      ...testCar,
      model: 'Prius',
      year: 2022,
      price: '30000.00',
      userId: testUserId,
    };

    await db.insert(cars).values([car1, car2, car3]);

    // Complex filter: Toyota cars from 2020-2023, price between 20k-28k
    const filteredCars = await db
      .select()
      .from(cars)
      .where(
        and(
          eq(cars.make, 'Toyota'),
          gte(cars.year, 2020),
          lte(cars.year, 2023),
          gte(cars.price, '20000.00'),
          lte(cars.price, '28000.00')
        )
      );

    expect(filteredCars.length).toBe(2); // Should match car1 and car2
    filteredCars.forEach((car) => {
      expect(car.make).toBe('Toyota');
      expect(car.year).toBeGreaterThanOrEqual(2020);
      expect(car.year).toBeLessThanOrEqual(2023);
      expect(parseFloat(car.price)).toBeGreaterThanOrEqual(20000);
      expect(parseFloat(car.price)).toBeLessThanOrEqual(28000);
    });
  });

  it('should perform aggregation queries', async () => {
    // Create test cars with different prices
    const cars_data = [
      { ...testCar, model: 'Camry', price: '20000.00', userId: testUserId },
      { ...testCar, model: 'Corolla', price: '25000.00', userId: testUserId },
      { ...testCar, model: 'Prius', price: '30000.00', userId: testUserId },
    ];

    await db.insert(cars).values(cars_data);

    // Get statistics
    const stats = await db
      .select({
        totalCars: count(),
        avgPrice: sql<number>`AVG(CAST(price AS DECIMAL))`,
        minPrice: sql<number>`MIN(CAST(price AS DECIMAL))`,
        maxPrice: sql<number>`MAX(CAST(price AS DECIMAL))`,
      })
      .from(cars)
      .where(eq(cars.make, 'Toyota'));

    expect(stats[0].totalCars).toBeGreaterThanOrEqual(3);
    expect(stats[0].avgPrice).toBeGreaterThan(0);
    expect(stats[0].minPrice).toBeLessThanOrEqual(stats[0].maxPrice);
  });
});

describe('Database Transaction Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    await testConnection();
  });

  afterAll(async () => {
    // Clean up
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    await closeConnection();
  });

  it('should handle successful transactions', async () => {
    await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx.insert(users).values(testUser).returning();
      testUserId = user.id;

      // Create car linked to user
      const carWithUserId = { ...testCar, userId: user.id };
      const [car] = await tx.insert(cars).values(carWithUserId).returning();

      expect(user.id).toBeDefined();
      expect(car.userId).toBe(user.id);
    });

    // Verify data was committed
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));

    expect(foundUser).toBeDefined();
  });

  it('should rollback failed transactions', async () => {
    const initialUserCount = await db.select({ count: count() }).from(users);

    try {
      await db.transaction(async (tx) => {
        // Create user
        await tx.insert(users).values({
          ...testUser,
          email: 'transaction-test@example.com',
        });

        // This should fail and rollback the transaction
        throw new Error('Intentional error to test rollback');
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify no data was committed
    const finalUserCount = await db.select({ count: count() }).from(users);
    expect(finalUserCount[0].count).toBe(initialUserCount[0].count);
  });
});
