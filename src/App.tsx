import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth';
import Index from './pages/Index';
import Inventory from './pages/Inventory';
import CarDetails from './pages/CarDetails';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminInventory from './pages/AdminInventory';
import AdminLogin from './pages/AdminLogin';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import AdminRoute from './components/auth/AdminRoute';
import SuperAdminRoute from './components/auth/SuperAdminRoute';
import AdminLoginCheck from './components/auth/AdminLoginCheck';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserManagement from './pages/UserManagement';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import PerformanceMonitor from './components/dev/PerformanceMonitor';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Index />} />
            <Route path='/inventory' element={<Inventory />} />
            <Route path='/car/:id' element={<CarDetails />} />
            <Route
              path='/admin'
              element={
                <AdminLoginCheck>
                  <AdminDashboard />
                </AdminLoginCheck>
              }
            />
            <Route
              path='/admin/inventory'
              element={
                <AdminLoginCheck>
                  <AdminInventory />
                </AdminLoginCheck>
              }
            />
            <Route
              path='/admin/add-vehicle'
              element={
                <AdminLoginCheck>
                  <AddVehicle />
                </AdminLoginCheck>
              }
            />
            <Route
              path='/admin/edit-vehicle/:id'
              element={
                <AdminLoginCheck>
                  <EditVehicle />
                </AdminLoginCheck>
              }
            />
            <Route
              path='/admin/users'
              element={
                <SuperAdminRoute>
                  <UserManagement />
                </SuperAdminRoute>
              }
            />
            <Route
              path='/admin/reports'
              element={
                <AdminLoginCheck>
                  <AdminReports />
                </AdminLoginCheck>
              }
            />
            <Route
              path='/admin/settings'
              element={
                <SuperAdminRoute>
                  <AdminSettings />
                </SuperAdminRoute>
              }
            />
            <Route
              path='/admin/legacy'
              element={
                <AdminLoginCheck>
                  <Admin />
                </AdminLoginCheck>
              }
            />
            <Route path='/login' element={<AdminLogin />} />
            <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            <Route path='/unauthorized' element={<Unauthorized />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <PerformanceMonitor />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
