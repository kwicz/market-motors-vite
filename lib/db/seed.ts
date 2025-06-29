import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

// Load environment variables
config();

// Import database schema
import * as schema from './schema';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Seed data
const seedData = {
  users: [
    {
      id: createId(),
      email: 'admin@marketmotors.com',
      username: 'admin',
      password: 'Admin123!',
      role: 'admin' as const,
      isActive: true,
    },
    {
      id: createId(),
      email: 'dealer@marketmotors.com',
      username: 'dealer',
      password: 'Dealer123!',
      role: 'admin' as const,
      isActive: true,
    },
    {
      id: createId(),
      email: 'customer@example.com',
      username: 'customer',
      password: 'Customer123!',
      role: 'user' as const,
      isActive: true,
    },
  ],

  vehicles: [
    {
      id: createId(),
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: '28500',
      mileage: 15000,
      color: 'Silver',
      fuelType: 'gasoline',
      transmission: 'automatic',
      condition: 'used',
      category: 'sedan',
      description:
        'Well-maintained Toyota Camry with low mileage. Perfect for daily commuting.',
      features: [
        'Air Conditioning',
        'Bluetooth',
        'Backup Camera',
        'Cruise Control',
      ],
      images: ['https://placehold.co/600x400?text=Toyota+Camry'],
      thumbnail: 'https://placehold.co/150x100?text=Toyota+Camry',
      inStock: true,
      isFeatured: false,
    },
    {
      id: createId(),
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      price: '24900',
      mileage: 22000,
      color: 'Blue',
      fuelType: 'gasoline',
      transmission: 'manual',
      condition: 'used',
      category: 'sedan',
      description:
        'Sporty Honda Civic with manual transmission. Great fuel economy.',
      features: [
        'Manual Transmission',
        'Sport Mode',
        'Apple CarPlay',
        'Lane Keeping Assist',
      ],
      images: ['https://placehold.co/600x400?text=Honda+Civic'],
      thumbnail: 'https://placehold.co/150x100?text=Honda+Civic',
      inStock: true,
      isFeatured: false,
    },
    {
      id: createId(),
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      price: '45000',
      mileage: 5000,
      color: 'Red',
      fuelType: 'gasoline',
      transmission: 'automatic',
      condition: 'new',
      category: 'truck',
      description:
        'Brand new Ford F-150 pickup truck. Perfect for work and play.',
      features: ['4WD', 'Towing Package', 'Bed Liner', 'Navigation System'],
      images: ['https://placehold.co/600x400?text=Ford+F-150'],
      thumbnail: 'https://placehold.co/150x100?text=Ford+F-150',
      inStock: true,
      isFeatured: false,
    },
    {
      id: createId(),
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      price: '42000',
      mileage: 8000,
      color: 'White',
      fuelType: 'electric',
      transmission: 'automatic',
      condition: 'used',
      category: 'sedan',
      description:
        'Electric Tesla Model 3 with autopilot features. Eco-friendly and efficient.',
      features: ['Autopilot', 'Supercharging', 'Premium Audio', 'Glass Roof'],
      images: ['https://placehold.co/600x400?text=Tesla+Model+3'],
      thumbnail: 'https://placehold.co/150x100?text=Tesla+Model+3',
      inStock: true,
      isFeatured: false,
    },
    {
      id: createId(),
      make: 'BMW',
      model: 'X5',
      year: 2022,
      price: '58000',
      mileage: 18000,
      color: 'Black',
      fuelType: 'gasoline',
      transmission: 'automatic',
      condition: 'used',
      category: 'suv',
      description:
        'Luxury BMW X5 SUV with premium features and excellent performance.',
      features: [
        'All-Wheel Drive',
        'Premium Sound',
        'Panoramic Sunroof',
        'Heated Seats',
      ],
      images: ['https://placehold.co/600x400?text=BMW+X5'],
      thumbnail: 'https://placehold.co/150x100?text=BMW+X5',
      inStock: true,
      isFeatured: false,
    },
  ],
};

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data (be careful in production!)
    console.log('🧹 Clearing existing data...');

    // Delete in correct order due to foreign key constraints
    if (schema.sessions) await db.delete(schema.sessions);
    if (schema.users) await db.delete(schema.users);

    console.log('✅ Existing data cleared');

    // Seed users
    console.log('👥 Seeding users...');
    const hashedUsers = await Promise.all(
      seedData.users.map(async (user) => {
        const { password, ...rest } = user;
        return {
          ...rest,
          passwordHash: await hash(password, 12),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
    );

    await db.insert(schema.users).values(hashedUsers);
    console.log(`✅ Seeded ${hashedUsers.length} users`);

    // Seed vehicles
    console.log('🚗 Seeding vehicles...');
    const vehiclesWithDefaults = seedData.vehicles.map((vehicle) => ({
      ...vehicle,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(schema.cars).values(vehiclesWithDefaults);
    console.log(`✅ Seeded ${vehiclesWithDefaults.length} vehicles`);

    console.log('🌱 Database seed completed');
  } catch (error) {
    console.error('🚨 Error seeding database:', error);
  }
}

if (require.main === module) {
  seed();
}
