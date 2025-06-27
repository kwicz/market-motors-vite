export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number | string; // Can be number or string from API
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
  userId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  refreshTokens: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}
