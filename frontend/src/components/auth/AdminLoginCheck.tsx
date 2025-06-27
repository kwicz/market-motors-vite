import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface AdminLoginCheckProps {
  children: React.ReactNode;
}

const AdminLoginCheck: React.FC<AdminLoginCheckProps> = ({ children }) => {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        <span className='ml-2 text-gray-600'>Verifying admin access...</span>
      </div>
    );
  }

  if (
    !user ||
    (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)
  ) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminLoginCheck;
