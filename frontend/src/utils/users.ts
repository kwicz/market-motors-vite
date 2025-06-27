import { UserRole } from '../types/auth';

// User interface for frontend
export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User creation data interface
export interface CreateUserData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
}

// User update data interface
export interface UpdateUserData {
  email?: string;
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

// User list query parameters
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'inactive';
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'username' | 'role';
  sortOrder?: 'asc' | 'desc';
}

// User statistics interface
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    user: number;
    admin: number;
    super_admin: number;
  };
  recentUsers: number;
}

// Paginated response interface
export interface PaginatedUsers {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Mock data for development - replace with actual API calls later
const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@marketmotors.com',
    username: 'admin',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'manager@marketmotors.com',
    username: 'manager',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'user-3',
    email: 'john.doe@example.com',
    username: 'johndoe',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'user-4',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    role: UserRole.USER,
    isActive: false,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

/**
 * Get paginated list of users
 */
export async function getUsers(
  params: UserListParams = {}
): Promise<PaginatedUsers> {
  // In a real application, this would make an API call to /api/users
  console.log('Fetching users with params:', params);

  let filteredUsers = [...MOCK_USERS];

  // Apply search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower)
    );
  }

  // Apply role filter
  if (params.role) {
    filteredUsers = filteredUsers.filter((user) => user.role === params.role);
  }

  // Apply status filter
  if (params.status) {
    const isActive = params.status === 'active';
    filteredUsers = filteredUsers.filter((user) => user.isActive === isActive);
  }

  // Apply sorting
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  filteredUsers.sort((a, b) => {
    let aValue: string | number | Date;
    let bValue: string | number | Date;

    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(a[sortBy]).getTime();
      bValue = new Date(b[sortBy]).getTime();
    } else if (sortBy === 'email' || sortBy === 'username') {
      aValue = (a[sortBy] || '').toLowerCase();
      bValue = (b[sortBy] || '').toLowerCase();
    } else if (sortBy === 'role') {
      aValue = a.role.toLowerCase();
      bValue = b.role.toLowerCase();
    } else {
      aValue = String(a[sortBy as keyof User] || '').toLowerCase();
      bValue = String(b[sortBy as keyof User] || '').toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / limit),
      hasNext: endIndex < filteredUsers.length,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  // In a real application, this would make an API call to /api/users/:id
  console.log('Fetching user by ID:', id);
  return MOCK_USERS.find((user) => user.id === id) || null;
}

/**
 * Create a new user (super admin only)
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  // In a real application, this would make an API call to POST /api/users
  console.log('Creating user:', userData);

  // Mock response
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: userData.email,
    username: userData.username,
    role: userData.role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Add to mock data for demonstration
  MOCK_USERS.push(newUser);

  return newUser;
}

/**
 * Update user information
 */
export async function updateUser(
  id: string,
  userData: UpdateUserData
): Promise<User> {
  // In a real application, this would make an API call to PUT /api/users/:id
  console.log('Updating user:', id, userData);

  const userIndex = MOCK_USERS.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Update mock data
  MOCK_USERS[userIndex] = {
    ...MOCK_USERS[userIndex],
    ...userData,
    updatedAt: new Date(),
  };

  return MOCK_USERS[userIndex];
}

/**
 * Update user role (super admin only)
 */
export async function updateUserRole(
  id: string,
  role: UserRole
): Promise<User> {
  // In a real application, this would make an API call to PATCH /api/users/:id/role
  console.log('Updating user role:', id, role);

  const userIndex = MOCK_USERS.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  MOCK_USERS[userIndex] = {
    ...MOCK_USERS[userIndex],
    role,
    updatedAt: new Date(),
  };

  return MOCK_USERS[userIndex];
}

/**
 * Update user status (activate/deactivate)
 */
export async function updateUserStatus(
  id: string,
  isActive: boolean
): Promise<User> {
  // In a real application, this would make an API call to PATCH /api/users/:id/status
  console.log('Updating user status:', id, isActive);

  const userIndex = MOCK_USERS.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  MOCK_USERS[userIndex] = {
    ...MOCK_USERS[userIndex],
    isActive,
    updatedAt: new Date(),
  };

  return MOCK_USERS[userIndex];
}

/**
 * Delete user (super admin only)
 */
export async function deleteUser(id: string): Promise<void> {
  // In a real application, this would make an API call to DELETE /api/users/:id
  console.log('Deleting user:', id);

  const userIndex = MOCK_USERS.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  MOCK_USERS.splice(userIndex, 1);
}

/**
 * Get user statistics (super admin only)
 */
export async function getUserStats(): Promise<UserStats> {
  // In a real application, this would make an API call to /api/users/stats/overview
  console.log('Fetching user statistics');

  const totalUsers = MOCK_USERS.length;
  const activeUsers = MOCK_USERS.filter((user) => user.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  const usersByRole = MOCK_USERS.reduce(
    (acc, user) => {
      if (user.role === UserRole.USER) acc.user++;
      else if (user.role === UserRole.ADMIN) acc.admin++;
      else if (user.role === UserRole.SUPER_ADMIN) acc.super_admin++;
      return acc;
    },
    { user: 0, admin: 0, super_admin: 0 }
  );

  // Recent users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = MOCK_USERS.filter(
    (user) => new Date(user.createdAt) >= thirtyDaysAgo
  ).length;

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersByRole,
    recentUsers,
  };
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    [UserRole.USER]: 'User',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
  };

  return roleNames[role] || 'Unknown';
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'bg-purple-100 text-purple-800';
    case UserRole.ADMIN:
      return 'bg-blue-100 text-blue-800';
    case UserRole.USER:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
