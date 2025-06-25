import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AuthProvider,
  useAuthContext,
  ProtectedRoute,
  AdminRoute,
  SuperAdminRoute,
  GuestRoute,
  RoleGuard,
  AdminGuard,
  SuperAdminGuard,
  PermissionGuard,
  AuthGuard,
  GuestGuard,
} from '../components/auth';
import { UserRole } from '../../lib/auth';

/**
 * Example App Component showing authentication setup
 */
const ExampleApp: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className='min-h-screen bg-gray-50'>
          <NavigationBar />
          <main className='container mx-auto px-4 py-8'>
            <Routes>
              {/* Public routes */}
              <Route path='/' element={<HomePage />} />

              {/* Guest-only routes (login, register) */}
              <Route
                path='/login'
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path='/register'
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />

              {/* Protected routes - require authentication */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/profile'
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path='/admin/*'
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              />

              {/* Super Admin-only routes */}
              <Route
                path='/super-admin/*'
                element={
                  <SuperAdminRoute>
                    <SuperAdminLayout />
                  </SuperAdminRoute>
                }
              />

              {/* Permission-based route */}
              <Route
                path='/inventory'
                element={
                  <ProtectedRoute requiredPermission='manage_inventory'>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Unauthorized page */}
              <Route path='/unauthorized' element={<UnauthorizedPage />} />

              {/* 404 page */}
              <Route path='*' element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

/**
 * Navigation Bar with conditional rendering based on authentication status
 */
const NavigationBar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthContext();

  return (
    <nav className='bg-white shadow-sm border-b'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-8'>
            <Link to='/' className='text-xl font-bold text-gray-900'>
              Auto Galleria
            </Link>

            <div className='flex space-x-4'>
              <Link to='/' className='text-gray-600 hover:text-gray-900'>
                Home
              </Link>

              {/* Show dashboard link only to authenticated users */}
              <AuthGuard>
                <Link
                  to='/dashboard'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Dashboard
                </Link>
              </AuthGuard>

              {/* Show admin link only to admins */}
              <AdminGuard>
                <Link to='/admin' className='text-gray-600 hover:text-gray-900'>
                  Admin
                </Link>
              </AdminGuard>

              {/* Show super admin link only to super admins */}
              <SuperAdminGuard>
                <Link
                  to='/super-admin'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Super Admin
                </Link>
              </SuperAdminGuard>

              {/* Show inventory link only to users with permission */}
              <PermissionGuard permission='manage_inventory'>
                <Link
                  to='/inventory'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Inventory
                </Link>
              </PermissionGuard>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            {/* Guest-only links */}
            <GuestGuard>
              <Link to='/login' className='text-gray-600 hover:text-gray-900'>
                Login
              </Link>
              <Link
                to='/register'
                className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
              >
                Register
              </Link>
            </GuestGuard>

            {/* Authenticated user menu */}
            <AuthGuard>
              <div className='flex items-center space-x-4'>
                <span className='text-gray-700'>
                  Hello, {user?.username || user?.email}
                </span>
                <Link
                  to='/profile'
                  className='text-gray-600 hover:text-gray-900'
                >
                  Profile
                </Link>
                <button
                  onClick={() => logout()}
                  className='text-gray-600 hover:text-gray-900'
                >
                  Logout
                </button>
              </div>
            </AuthGuard>
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * Home Page with role-based content
 */
const HomePage: React.FC = () => {
  return (
    <div className='max-w-4xl mx-auto'>
      <h1 className='text-4xl font-bold text-gray-900 mb-8'>
        Welcome to Auto Galleria
      </h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Public content */}
        <div className='bg-white p-6 rounded-lg shadow'>
          <h2 className='text-xl font-semibold mb-4'>Browse Cars</h2>
          <p className='text-gray-600'>
            Explore our extensive collection of quality vehicles.
          </p>
        </div>

        {/* Content for authenticated users */}
        <RoleGuard requireAuth={true}>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Your Dashboard</h2>
            <p className='text-gray-600'>
              Access your personal dashboard and saved vehicles.
            </p>
            <Link
              to='/dashboard'
              className='inline-block mt-4 text-blue-600 hover:text-blue-800'
            >
              Go to Dashboard →
            </Link>
          </div>
        </RoleGuard>

        {/* Content for admins only */}
        <AdminGuard>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Admin Panel</h2>
            <p className='text-gray-600'>
              Manage inventory, users, and system settings.
            </p>
            <Link
              to='/admin'
              className='inline-block mt-4 text-blue-600 hover:text-blue-800'
            >
              Admin Panel →
            </Link>
          </div>
        </AdminGuard>

        {/* Content for users with inventory permission */}
        <PermissionGuard permission='manage_inventory'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h2 className='text-xl font-semibold mb-4'>Inventory Management</h2>
            <p className='text-gray-600'>
              Add, edit, and manage vehicle inventory.
            </p>
            <Link
              to='/inventory'
              className='inline-block mt-4 text-blue-600 hover:text-blue-800'
            >
              Manage Inventory →
            </Link>
          </div>
        </PermissionGuard>
      </div>
    </div>
  );
};

/**
 * Example page components
 */
const LoginPage: React.FC = () => (
  <div className='max-w-md mx-auto bg-white p-8 rounded-lg shadow'>
    <h1 className='text-2xl font-bold mb-6'>Login</h1>
    <p>Login form would go here...</p>
  </div>
);

const RegisterPage: React.FC = () => (
  <div className='max-w-md mx-auto bg-white p-8 rounded-lg shadow'>
    <h1 className='text-2xl font-bold mb-6'>Register</h1>
    <p>Registration form would go here...</p>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuthContext();

  return (
    <div className='max-w-4xl mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Dashboard</h1>
      <div className='bg-white p-6 rounded-lg shadow'>
        <h2 className='text-xl font-semibold mb-4'>Welcome back!</h2>
        <p className='text-gray-600 mb-4'>
          Role: {user?.role} | Status: {user?.isActive ? 'Active' : 'Inactive'}
        </p>

        {/* Role-specific dashboard sections */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
          <AdminGuard>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='font-semibold text-blue-900'>Admin Features</h3>
              <p className='text-blue-700 text-sm'>
                You have admin access to manage the system.
              </p>
            </div>
          </AdminGuard>

          <SuperAdminGuard>
            <div className='bg-purple-50 p-4 rounded-lg'>
              <h3 className='font-semibold text-purple-900'>
                Super Admin Features
              </h3>
              <p className='text-purple-700 text-sm'>
                You have full system access.
              </p>
            </div>
          </SuperAdminGuard>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => (
  <div className='max-w-2xl mx-auto bg-white p-8 rounded-lg shadow'>
    <h1 className='text-2xl font-bold mb-6'>User Profile</h1>
    <p>Profile management would go here...</p>
  </div>
);

const AdminLayout: React.FC = () => (
  <div className='max-w-6xl mx-auto'>
    <h1 className='text-3xl font-bold mb-6'>Admin Panel</h1>
    <div className='bg-white p-6 rounded-lg shadow'>
      <p>Admin dashboard and management tools would go here...</p>
    </div>
  </div>
);

const SuperAdminLayout: React.FC = () => (
  <div className='max-w-6xl mx-auto'>
    <h1 className='text-3xl font-bold mb-6'>Super Admin Panel</h1>
    <div className='bg-white p-6 rounded-lg shadow'>
      <p>Super admin dashboard and system management would go here...</p>
    </div>
  </div>
);

const InventoryPage: React.FC = () => (
  <div className='max-w-6xl mx-auto'>
    <h1 className='text-3xl font-bold mb-6'>Inventory Management</h1>
    <div className='bg-white p-6 rounded-lg shadow'>
      <p>Vehicle inventory management would go here...</p>
    </div>
  </div>
);

const UnauthorizedPage: React.FC = () => (
  <div className='max-w-2xl mx-auto text-center'>
    <h1 className='text-3xl font-bold text-red-600 mb-4'>Access Denied</h1>
    <p className='text-gray-600 mb-6'>
      You don't have permission to access this page.
    </p>
    <Link
      to='/'
      className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700'
    >
      Go Home
    </Link>
  </div>
);

const NotFoundPage: React.FC = () => (
  <div className='max-w-2xl mx-auto text-center'>
    <h1 className='text-3xl font-bold text-gray-900 mb-4'>Page Not Found</h1>
    <p className='text-gray-600 mb-6'>
      The page you're looking for doesn't exist.
    </p>
    <Link
      to='/'
      className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700'
    >
      Go Home
    </Link>
  </div>
);

export default ExampleApp;
