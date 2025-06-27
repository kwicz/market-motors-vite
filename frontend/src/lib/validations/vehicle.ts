import { z } from 'zod';

// Base car schema for common validations
const baseCarSchema = {
  make: z
    .string()
    .min(1, 'Make is required')
    .max(50, 'Make must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s-]+$/,
      'Make can only contain letters, spaces, and hyphens'
    ),

  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters'),

  year: z
    .number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(
      new Date().getFullYear() + 1,
      `Year cannot be later than ${new Date().getFullYear() + 1}`
    ),

  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal number')
    .refine((val) => parseFloat(val) >= 0, 'Price must be non-negative')
    .refine(
      (val) => parseFloat(val) <= 10000000,
      'Price cannot exceed $10,000,000'
    ),

  mileage: z
    .number()
    .int('Mileage must be an integer')
    .min(0, 'Mileage cannot be negative')
    .max(1000000, 'Mileage cannot exceed 1,000,000'),

  color: z
    .string()
    .min(1, 'Color is required')
    .max(30, 'Color must be less than 30 characters')
    .regex(
      /^[a-zA-Z\s-]+$/,
      'Color can only contain letters, spaces, and hyphens'
    ),

  fuelType: z.enum(
    ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid'],
    {
      errorMap: () => ({ message: 'Please select a valid fuel type' }),
    }
  ),

  transmission: z.enum(['Manual', 'Automatic', 'CVT'], {
    errorMap: () => ({ message: 'Please select a valid transmission type' }),
  }),

  condition: z.enum(['New', 'Used', 'Certified Pre-Owned'], {
    errorMap: () => ({ message: 'Please select a valid condition' }),
  }),

  category: z.enum(
    [
      'Sedan',
      'SUV',
      'Hatchback',
      'Coupe',
      'Convertible',
      'Truck',
      'Van',
      'Sports',
      'Luxury',
      'Electric',
    ],
    {
      errorMap: () => ({ message: 'Please select a valid category' }),
    }
  ),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),

  features: z
    .array(
      z
        .string()
        .min(1, 'Feature cannot be empty')
        .max(100, 'Feature must be less than 100 characters')
    )
    .min(1, 'At least one feature is required')
    .max(20, 'Cannot have more than 20 features'),

  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Cannot have more than 10 images'),

  thumbnail: z.string().url('Thumbnail must be a valid URL'),

  inStock: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
};

// Car creation schema
export const carCreationSchema = z.object({
  ...baseCarSchema,
});

// Car update schema (all fields optional except ID)
export const carUpdateSchema = z.object({
  id: z.string().uuid('Invalid car ID'),
  make: baseCarSchema.make.optional(),
  model: baseCarSchema.model.optional(),
  year: baseCarSchema.year.optional(),
  price: baseCarSchema.price.optional(),
  mileage: baseCarSchema.mileage.optional(),
  color: baseCarSchema.color.optional(),
  fuelType: baseCarSchema.fuelType.optional(),
  transmission: baseCarSchema.transmission.optional(),
  condition: baseCarSchema.condition.optional(),
  category: baseCarSchema.category.optional(),
  description: baseCarSchema.description.optional(),
  features: baseCarSchema.features.optional(),
  images: baseCarSchema.images.optional(),
  thumbnail: baseCarSchema.thumbnail.optional(),
  inStock: baseCarSchema.inStock.optional(),
  isFeatured: baseCarSchema.isFeatured.optional(),
});

// Car filtering schema
export const carFilterSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  minYear: z.number().int().min(1900).optional(),
  maxYear: z
    .number()
    .int()
    .max(new Date().getFullYear() + 1)
    .optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minMileage: z.number().int().min(0).optional(),
  maxMileage: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  color: z.string().optional(),
});

// Car search and pagination schema
export const carSearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(12),
  sortBy: z
    .enum(['price', 'year', 'mileage', 'createdAt', 'make', 'model'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  ...carFilterSchema.shape,
});

// Car ID validation schema
export const carIdSchema = z.object({
  id: z.string().uuid('Invalid car ID'),
});

// Bulk operations schema
export const bulkCarOperationSchema = z.object({
  carIds: z
    .array(z.string().uuid('Invalid car ID'))
    .min(1, 'At least one car ID is required'),
  operation: z.enum(['delete', 'feature', 'unfeature', 'stock', 'unstock'], {
    errorMap: () => ({ message: 'Please select a valid operation' }),
  }),
});

// Car statistics schema for admin dashboard
export const carStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  category: z.string().optional(),
  condition: z.string().optional(),
});

// Type exports
export type CarCreationInput = z.infer<typeof carCreationSchema>;
export type CarUpdateInput = z.infer<typeof carUpdateSchema>;
export type CarFilterInput = z.infer<typeof carFilterSchema>;
export type CarSearchInput = z.infer<typeof carSearchSchema>;
export type CarIdInput = z.infer<typeof carIdSchema>;
export type BulkCarOperationInput = z.infer<typeof bulkCarOperationSchema>;
