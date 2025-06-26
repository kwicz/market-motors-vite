import express from 'express';
import {
  eq,
  and,
  desc,
  asc,
  count,
  gte,
  lte,
  like,
  inArray,
  sql,
} from 'drizzle-orm';
import { db } from '../../lib/db';
import { cars } from '../../lib/db/schema';
import { authorize, authenticate } from '../middleware/auth';
import { vehicleCacheService } from '../services/vehicleCache';
import {
  carCreationSchema,
  carUpdateSchema,
  carSearchSchema,
  bulkCarOperationSchema,
  carStatsSchema,
} from '../validations/vehicle';
import {
  asyncHandler,
  sendSuccess,
  sendPaginatedResponse,
  NotFoundError,
  ValidationError,
  ConflictError,
  DatabaseError,
} from '../middleware/error';

const router = express.Router();

// GET /api/cars - Get all cars with filtering, sorting, and pagination
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const validatedQuery = carSearchSchema.parse(req.query);

    // Try to get cached data first
    const cachedData = await vehicleCacheService.getCachedCarsList(
      validatedQuery
    );
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      condition,
      category,
      fuelType,
      transmission,
      isFeatured,
      inStock,
      search,
      color,
    } = validatedQuery;

    // Build where conditions
    const whereConditions = [];

    if (make) whereConditions.push(eq(cars.make, make));
    if (model) whereConditions.push(eq(cars.model, model));
    if (minYear) whereConditions.push(gte(cars.year, minYear));
    if (maxYear) whereConditions.push(lte(cars.year, maxYear));
    if (minPrice)
      whereConditions.push(gte(sql`CAST(${cars.price} AS DECIMAL)`, minPrice));
    if (maxPrice)
      whereConditions.push(lte(sql`CAST(${cars.price} AS DECIMAL)`, maxPrice));
    if (condition) whereConditions.push(eq(cars.condition, condition));
    if (category) whereConditions.push(eq(cars.category, category));
    if (fuelType) whereConditions.push(eq(cars.fuelType, fuelType));
    if (transmission) whereConditions.push(eq(cars.transmission, transmission));
    if (isFeatured !== undefined)
      whereConditions.push(eq(cars.isFeatured, isFeatured));
    if (inStock !== undefined) whereConditions.push(eq(cars.inStock, inStock));
    if (color) whereConditions.push(eq(cars.color, color));
    if (search) {
      whereConditions.push(
        sql`LOWER(${cars.make} || ' ' || ${cars.model} || ' ' || ${
          cars.description
        }) LIKE ${`%${search.toLowerCase()}%`}`
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(cars)
      .where(whereClause);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // Build order by clause
    const sortColumn =
      {
        price: sql`CAST(${cars.price} AS DECIMAL)`,
        year: cars.year,
        mileage: cars.mileage,
        createdAt: cars.createdAt,
        make: cars.make,
        model: cars.model,
      }[sortBy] || cars.createdAt;

    const orderByClause =
      sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn);

    // Get cars
    const carsResult = await db
      .select()
      .from(cars)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const pagination = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    const filters = {
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      condition,
      category,
      fuelType,
      transmission,
      isFeatured,
      inStock,
      search,
      color,
    };

    sendPaginatedResponse(
      res,
      carsResult,
      pagination,
      'Cars retrieved successfully',
      filters
    );
  })
);

// GET /api/cars/dashboard/metrics - Get dashboard metrics for admin
router.get(
  '/dashboard/metrics',
  asyncHandler(authenticate),
  authorize(['view_admin_dashboard']),
  asyncHandler(async (req, res) => {
    const validatedQuery = carStatsSchema.parse(req.query);
    const { period = 'month', category, condition } = validatedQuery;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case 'week': {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // Build filters
    const filters = [];
    if (category) filters.push(eq(cars.category, category));
    if (condition) filters.push(eq(cars.condition, condition));
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Get current metrics
    const currentMetrics = await db
      .select({
        totalCars: count(),
        avgPrice: sql<number>`ROUND(AVG(CAST(${cars.price} AS DECIMAL))::numeric, 2)`,
        avgMileage: sql<number>`ROUND(AVG(${cars.mileage})::numeric, 0)`,
        avgYear: sql<number>`ROUND(AVG(${cars.year})::numeric, 0)`,
        featuredCount: sql<number>`COUNT(*) FILTER (WHERE ${cars.isFeatured} = true)`,
        inStockCount: sql<number>`COUNT(*) FILTER (WHERE ${cars.inStock} = true)`,
      })
      .from(cars)
      .where(whereClause);

    // Get recent additions (current period)
    const recentAdditions = await db
      .select({
        totalCars: count(),
      })
      .from(cars)
      .where(
        and(
          gte(cars.createdAt, startDate),
          ...(whereClause ? [whereClause] : [])
        )
      );

    // Get previous period for comparison
    const previousStartDate = new Date(startDate);
    switch (period) {
      case 'day':
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    const previousAdditions = await db
      .select({
        totalCars: count(),
      })
      .from(cars)
      .where(
        and(
          gte(cars.createdAt, previousStartDate),
          lte(cars.createdAt, startDate),
          ...(whereClause ? [whereClause] : [])
        )
      );

    // Calculate growth
    const currentTotal = currentMetrics[0]?.totalCars || 0;
    const recentTotal = recentAdditions[0]?.totalCars || 0;
    const previousTotal = previousAdditions[0]?.totalCars || 0;
    const growthPercentage =
      previousTotal > 0
        ? Math.round((recentTotal / previousTotal - 1) * 100)
        : 0;

    // Get distribution data
    const categoryDistribution = await db
      .select({
        category: cars.category,
        count: count(),
      })
      .from(cars)
      .where(whereClause)
      .groupBy(cars.category);

    const conditionDistribution = await db
      .select({
        condition: cars.condition,
        count: count(),
      })
      .from(cars)
      .where(whereClause)
      .groupBy(cars.condition);

    // Get top makes
    const topMakes = await db
      .select({
        make: cars.make,
        count: count(),
        avgPrice: sql<number>`ROUND(AVG(CAST(${cars.price} AS DECIMAL))::numeric, 2)`,
      })
      .from(cars)
      .where(whereClause)
      .groupBy(cars.make)
      .orderBy(desc(count()))
      .limit(5);

    const metrics = {
      overview: {
        totalCars: currentTotal,
        recentAdditions: recentTotal,
        growthPercentage,
        averagePrice: currentMetrics[0]?.avgPrice || 0,
        averageMileage: currentMetrics[0]?.avgMileage || 0,
        averageYear: currentMetrics[0]?.avgYear || 0,
        featuredCars: currentMetrics[0]?.featuredCount || 0,
        inStockCars: currentMetrics[0]?.inStockCount || 0,
      },
      trends: {
        period,
        currentPeriodAdditions: recentTotal,
        previousPeriodAdditions: previousTotal,
        growthPercentage,
      },
      distribution: {
        byCategory: categoryDistribution,
        byCondition: conditionDistribution,
      },
      topInsights: {
        topMakes,
      },
    };

    sendSuccess(res, metrics, 'Dashboard metrics retrieved successfully');
  })
);

// GET /api/cars/:id - Get single car by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const car = await db.select().from(cars).where(eq(cars.id, id)).limit(1);

    if (car.length === 0) {
      throw new NotFoundError('Car');
    }

    sendSuccess(res, car[0], 'Car retrieved successfully');
  })
);

// POST /api/cars - Create new car
router.post(
  '/',
  asyncHandler(authenticate),
  authorize(['create_car']),
  asyncHandler(async (req, res) => {
    const validatedData = carCreationSchema.parse(req.body);

    const newCar = await db
      .insert(cars)
      .values({
        ...validatedData,
        userId: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (newCar.length === 0) {
      throw new DatabaseError('Failed to create car');
    }

    sendSuccess(res, newCar[0], 'Car created successfully', 201);
  })
);

// PUT /api/cars/:id - Update car
router.put(
  '/:id',
  asyncHandler(authenticate),
  authorize(['update_car']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validatedData = carUpdateSchema.parse(req.body);

    const updatedCar = await db
      .update(cars)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, id))
      .returning();

    if (updatedCar.length === 0) {
      throw new NotFoundError('Car');
    }

    sendSuccess(res, updatedCar[0], 'Car updated successfully');
  })
);

// DELETE /api/cars/:id - Delete car
router.delete(
  '/:id',
  asyncHandler(authenticate),
  authorize(['delete_car']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedCar = await db.delete(cars).where(eq(cars.id, id)).returning();

    if (deletedCar.length === 0) {
      throw new NotFoundError('Car');
    }

    sendSuccess(res, null, 'Car deleted successfully');
  })
);

// PATCH /api/cars/:id/featured - Toggle featured status
router.patch(
  '/:id/featured',
  asyncHandler(authenticate),
  authorize(['manage_inventory']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { featured } = req.body;

    if (typeof featured !== 'boolean') {
      throw new ValidationError('Featured status must be a boolean');
    }

    const updatedCar = await db
      .update(cars)
      .set({
        isFeatured: featured,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, id))
      .returning();

    if (updatedCar.length === 0) {
      throw new NotFoundError('Car');
    }

    sendSuccess(
      res,
      updatedCar[0],
      `Car ${featured ? 'featured' : 'unfeatured'} successfully`
    );
  })
);

// PATCH /api/cars/:id/stock - Update stock status
router.patch(
  '/:id/stock',
  asyncHandler(authenticate),
  authorize(['manage_inventory']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { inStock } = req.body;

    if (typeof inStock !== 'boolean') {
      throw new ValidationError('Stock status must be a boolean');
    }

    const updatedCar = await db
      .update(cars)
      .set({
        inStock,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, id))
      .returning();

    if (updatedCar.length === 0) {
      throw new NotFoundError('Car');
    }

    sendSuccess(
      res,
      updatedCar[0],
      `Car marked as ${inStock ? 'in stock' : 'out of stock'} successfully`
    );
  })
);

// POST /api/cars/bulk - Perform bulk operations on cars
router.post(
  '/bulk',
  asyncHandler(authenticate),
  authorize(['manage_inventory']),
  asyncHandler(async (req, res) => {
    const validatedData = bulkCarOperationSchema.parse(req.body);
    const { carIds, operation, updateData } = validatedData;

    // Verify all cars exist
    const existingCars = await db
      .select({ id: cars.id })
      .from(cars)
      .where(inArray(cars.id, carIds));

    if (existingCars.length !== carIds.length) {
      const foundIds = existingCars.map((car) => car.id);
      const missingIds = carIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Cars not found: ${missingIds.join(', ')}`);
    }

    let result;
    const timestamp = new Date();

    switch (operation) {
      case 'delete': {
        result = await db
          .delete(cars)
          .where(inArray(cars.id, carIds))
          .returning({ id: cars.id });
        break;
      }
      case 'feature': {
        result = await db
          .update(cars)
          .set({ isFeatured: true, updatedAt: timestamp })
          .where(inArray(cars.id, carIds))
          .returning({ id: cars.id, isFeatured: cars.isFeatured });
        break;
      }
      case 'unfeature': {
        result = await db
          .update(cars)
          .set({ isFeatured: false, updatedAt: timestamp })
          .where(inArray(cars.id, carIds))
          .returning({ id: cars.id, isFeatured: cars.isFeatured });
        break;
      }
      case 'stock': {
        result = await db
          .update(cars)
          .set({ inStock: true, updatedAt: timestamp })
          .where(inArray(cars.id, carIds))
          .returning({ id: cars.id, inStock: cars.inStock });
        break;
      }
      case 'unstock': {
        result = await db
          .update(cars)
          .set({ inStock: false, updatedAt: timestamp })
          .where(inArray(cars.id, carIds))
          .returning({ id: cars.id, inStock: cars.inStock });
        break;
      }
      case 'update': {
        if (!updateData) {
          throw new ValidationError(
            'Update data is required for update operation'
          );
        }
        result = await db
          .update(cars)
          .set({ ...updateData, updatedAt: timestamp })
          .where(inArray(cars.id, carIds))
          .returning();
        break;
      }
      default:
        throw new ValidationError('Invalid operation');
    }

    const responseData = {
      operation,
      affectedCount: result.length,
      affectedCars: result,
      ...(operation === 'update' && updateData && { updateData }),
    };

    sendSuccess(
      res,
      responseData,
      `Bulk ${operation} operation completed successfully`
    );
  })
);

// POST /api/cars/bulk/preview - Preview bulk operation results
router.post(
  '/bulk/preview',
  asyncHandler(authenticate),
  authorize(['manage_inventory']),
  asyncHandler(async (req, res) => {
    const validatedData = bulkCarOperationSchema.parse(req.body);
    const { carIds, operation, updateData } = validatedData;

    // Get current state of cars
    const currentCars = await db
      .select()
      .from(cars)
      .where(inArray(cars.id, carIds));

    if (currentCars.length !== carIds.length) {
      const foundIds = currentCars.map((car) => car.id);
      const missingIds = carIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Cars not found: ${missingIds.join(', ')}`);
    }

    // Calculate what would change
    let previewData: Record<string, unknown>;
    switch (operation) {
      case 'delete': {
        previewData = {
          operation: 'delete',
          affectedCount: currentCars.length,
          carsToDelete: currentCars.map((car) => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
          })),
        };
        break;
      }
      case 'feature': {
        const carsToFeature = currentCars.filter((car) => !car.isFeatured);
        previewData = {
          operation: 'feature',
          affectedCount: carsToFeature.length,
          carsToFeature: carsToFeature.map((car) => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            currentStatus: car.isFeatured,
          })),
          alreadyFeatured: currentCars.length - carsToFeature.length,
        };
        break;
      }
      case 'unfeature': {
        const carsToUnfeature = currentCars.filter((car) => car.isFeatured);
        previewData = {
          operation: 'unfeature',
          affectedCount: carsToUnfeature.length,
          carsToUnfeature: carsToUnfeature.map((car) => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            currentStatus: car.isFeatured,
          })),
          alreadyUnfeatured: currentCars.length - carsToUnfeature.length,
        };
        break;
      }
      case 'stock': {
        const carsToStock = currentCars.filter((car) => !car.inStock);
        previewData = {
          operation: 'stock',
          affectedCount: carsToStock.length,
          carsToStock: carsToStock.map((car) => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            currentStatus: car.inStock,
          })),
          alreadyInStock: currentCars.length - carsToStock.length,
        };
        break;
      }
      case 'unstock': {
        const carsToUnstock = currentCars.filter((car) => car.inStock);
        previewData = {
          operation: 'unstock',
          affectedCount: carsToUnstock.length,
          carsToUnstock: carsToUnstock.map((car) => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            currentStatus: car.inStock,
          })),
          alreadyOutOfStock: currentCars.length - carsToUnstock.length,
        };
        break;
      }
      case 'update': {
        if (!updateData) {
          throw new ValidationError(
            'Update data is required for update operation'
          );
        }
        previewData = {
          operation: 'update',
          affectedCount: currentCars.length,
          updateData,
          carsToUpdate: currentCars.map((car) => ({
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            currentValues: Object.keys(updateData).reduce((acc, key) => {
              acc[key] = car[key as keyof typeof car];
              return acc;
            }, {} as Record<string, unknown>),
            newValues: updateData,
          })),
        };
        break;
      }
      default:
        throw new ValidationError('Invalid operation');
    }

    sendSuccess(
      res,
      previewData,
      'Bulk operation preview generated successfully'
    );
  })
);

export default router;
