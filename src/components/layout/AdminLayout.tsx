import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Car,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Shield,
  Plus,
  FileText,
} from 'lucide-react';
import { UserRole } from '../../types/auth';
import { logout } from '@/utils/auth';
import { toast } from 'sonner';
import { siteConfig } from '@/siteConfig';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: UserRole;
  badge?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasRole } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin',
      icon: BarChart3,
    },
    {
      id: 'inventory',
      label: 'Vehicle Inventory',
      path: '/admin/inventory',
      icon: Car,
    },
    {
      id: 'add-vehicle',
      label: 'Add Vehicle',
      path: '/admin/add-vehicle',
      icon: Plus,
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/admin/reports',
      icon: FileText,
    },
    {
      id: 'users',
      label: 'User Management',
      path: '/admin/users',
      icon: Users,
      requiredRole: UserRole.SUPER_ADMIN,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/admin/settings',
      icon: Settings,
      requiredRole: UserRole.SUPER_ADMIN,
    },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.requiredRole || hasRole(item.requiredRole)
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'text-red-600 bg-red-100';
      case UserRole.ADMIN:
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className='AdminLayout flex h-screen bg-gray-50'>
      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className='flex flex-col h-full'>
          {/* Logo/Header */}
          <div className='flex items-center justify-between px-6 py-4 border-b'>
            <Link to='/' className='flex items-center space-x-2'>
              <img
                src={siteConfig.styles.logos.bigLogo}
                alt={siteConfig.siteName + ' logo'}
                className='h-8 w-auto mr-2'
                style={{ maxHeight: 32 }}
              />
            </Link>
            <Button
              variant='ghost'
              size='sm'
              className='lg:hidden'
              onClick={() => setSidebarOpen(false)}
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* User Info */}
          <div className='px-6 py-4 border-b bg-gray-50'>
            <div className='flex items-center space-x-3'>
              <Avatar>
                <AvatarFallback className='bg-primary text-white'>
                  {user ? getUserInitials(user.email) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {user?.email}
                </p>
                <div className='flex items-center space-x-1'>
                  <Shield className='h-3 w-3' />
                  <span
                    className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    ${
                      user
                        ? getRoleColor(user.role)
                        : 'text-gray-600 bg-gray-100'
                    }
                  `}
                  >
                    {user?.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className='flex-1 px-4 py-4 space-y-1 overflow-y-auto'>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className='mr-3 h-5 w-5' />
                  {item.label}
                  {item.badge && (
                    <span className='ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full'>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className='px-4 py-4 border-t'>
            <Link
              to='/'
              className='flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 mb-2'
            >
              <Home className='mr-3 h-5 w-5' />
              View Site
            </Link>
            <Button
              variant='ghost'
              className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'
              onClick={handleLogout}
            >
              <LogOut className='mr-3 h-5 w-5' />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden lg:ml-0'>
        {/* Top Bar */}
        <header className='bg-white shadow-sm border-b px-6 py-4 lg:px-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Button
                variant='ghost'
                size='sm'
                className='lg:hidden'
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className='h-5 w-5' />
              </Button>
              <h1 className='text-2xl font-semibold text-gray-900'>
                Admin Panel
              </h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-6 lg:p-8'>{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
