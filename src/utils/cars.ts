import { Car, NewCar } from '../../lib/db/schema';

// Sample car data for initial seeding
export const sampleCars: Omit<NewCar, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    make: 'Audi',
    model: 'RS7',
    year: 2023,
    price: '120000.00',
    mileage: 0,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    color: 'Glacier White',
    description:
      'Experience uncompromising performance with the all-new Audi RS7. This masterpiece of engineering combines breathtaking acceleration with refined luxury, creating an unparalleled driving experience.',
    features: [
      'Head-up Display',
      'Adaptive Cruise Control',
      'Bang & Olufsen Sound System',
      'Matrix LED Headlights',
      'Sport Differential',
      'Quattro All-Wheel Drive',
    ],
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1535732820275-9ffd998cac22?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    ],
    thumbnail:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    category: 'Luxury',
    condition: 'New',
    isFeatured: true,
    inStock: true,
    userId: null,
  },
  {
    make: 'BMW',
    model: 'i4',
    year: 2023,
    price: '65900.00',
    mileage: 12,
    fuelType: 'Electric',
    transmission: 'Automatic',
    color: 'Mineral White Metallic',
    description:
      'The BMW i4 blends cutting-edge electric performance with classic BMW driving dynamics. Zero emissions meets pure driving pleasure in this sophisticated gran coupé.',
    features: [
      'BMW Curved Display',
      '5G Connectivity',
      'Driving Assistant Professional',
      'BMW IconicSounds Electric',
      'Adaptive M Suspension',
    ],
    images: [
      'https://images.unsplash.com/photo-1655412398253-d7f18ea6e8ee?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1622542796254-5b9c46a259b6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1633867113487-5116a41fe2c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    ],
    thumbnail:
      'https://images.unsplash.com/photo-1655412398253-d7f18ea6e8ee?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    category: 'Electric',
    condition: 'New',
    isFeatured: true,
    inStock: true,
    userId: null,
  },
  {
    make: 'Porsche',
    model: '911 Carrera',
    year: 2023,
    price: '107550.00',
    mileage: 1500,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    color: 'Guards Red',
    description:
      "The iconic Porsche 911 continues to set the standard for high-performance sports cars. Combining heritage with innovation, the 911 Carrera delivers an exhilarating driving experience that's unmistakably Porsche.",
    features: [
      'Sport Chrono Package',
      'PASM Sport Suspension',
      'Burmester High-End Surround Sound System',
      'LED Matrix Headlights',
      'Porsche Dynamic Chassis Control',
    ],
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
      'https://images.unsplash.com/photo-1626668893632-6f3a4466d109?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
    ],
    thumbnail:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    category: 'Sports',
    condition: 'Certified Pre-Owned',
    isFeatured: true,
    inStock: true,
    userId: null,
  },
];

// Note: Database operations will be implemented when we connect the backend
// For now, this serves as a placeholder to maintain the interface

// Mock functions for development - replace with actual API calls later
export async function getFeaturedCars(): Promise<Car[]> {
  // Convert sample data to Car type with required fields
  return sampleCars
    .map((car, index) => ({
      ...car,
      id: `car-${index + 1}`,
      features: car.features || [],
      images: car.images || [],
      userId: car.userId || null,
      inStock: car.inStock ?? true,
      isFeatured: car.isFeatured ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    .filter((car) => car.isFeatured);
}

export async function loadCars(): Promise<Car[]> {
  // Convert sample data to Car type with required fields
  return sampleCars.map((car, index) => ({
    ...car,
    id: `car-${index + 1}`,
    features: car.features || [],
    images: car.images || [],
    userId: car.userId || null,
    inStock: car.inStock ?? true,
    isFeatured: car.isFeatured ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function saveCar(car: NewCar): Promise<Car> {
  // Mock save operation - in real app, this would call the API
  const savedCar: Car = {
    ...car,
    id: `car-${Date.now()}`,
    features: car.features || [],
    images: car.images || [],
    userId: car.userId || null,
    inStock: car.inStock ?? true,
    isFeatured: car.isFeatured ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return savedCar;
}

export async function deleteCar(carId: string): Promise<void> {
  // Mock delete operation - in real app, this would call the API
  console.log(`Deleting car with ID: ${carId}`);
}

export async function getCarById(id: string): Promise<Car | null> {
  const cars = await loadCars();
  return cars.find((car) => car.id === id) || null;
}

// Bulk operations functions
export interface BulkOperationData {
  carIds: string[];
  operation:
    | 'delete'
    | 'feature'
    | 'unfeature'
    | 'stock'
    | 'unstock'
    | 'update';
  updateData?: {
    category?: string;
    condition?: string;
    fuelType?: string;
    transmission?: string;
    color?: string;
    isFeatured?: boolean;
    inStock?: boolean;
  };
}

export interface BulkOperationResult {
  operation: string;
  affectedCount: number;
  affectedCars: Array<{ id: string; [key: string]: unknown }>;
  updateData?: Record<string, unknown>;
}

export interface BulkOperationPreview {
  operation: string;
  affectedCount: number;
  preview: string;
}

export async function performBulkOperation(
  data: BulkOperationData
): Promise<BulkOperationResult> {
  // In a real application, this would make an API call to /api/cars/bulk
  // For now, we'll simulate the operation
  console.log('Performing bulk operation:', data);

  // Mock response
  return {
    operation: data.operation,
    affectedCount: data.carIds.length,
    affectedCars: data.carIds.map((id) => ({ id })),
    ...(data.updateData && { updateData: data.updateData }),
  };
}

export async function previewBulkOperation(
  data: BulkOperationData
): Promise<BulkOperationPreview> {
  // In a real application, this would make an API call to /api/cars/bulk/preview
  // For now, we'll simulate the preview
  console.log('Previewing bulk operation:', data);

  // Mock preview response
  return {
    operation: data.operation,
    affectedCount: data.carIds.length,
    preview: `This will ${data.operation} ${data.carIds.length} vehicles`,
  };
}
