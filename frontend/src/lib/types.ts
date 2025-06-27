// Car type definition for frontend use
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: string;
  mileage: number;
  color: string;
  fuelType: string;
  transmission: string;
  condition: string;
  category: string;
  description: string;
  features: string[];
  images: string[];
  thumbnail: string;
  inStock: boolean;
  isFeatured: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// User type definition for frontend use
export interface User {
  id: string;
  email: string;
  username?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
