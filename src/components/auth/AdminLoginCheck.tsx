
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminLoggedIn } from '@/utils/auth';

const AdminLoginCheck = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if admin is logged in
    const adminLoggedIn = isAdminLoggedIn();
    setIsLoggedIn(adminLoggedIn);
    setLoading(false);
  }, []);

  if (loading) {
    // You could show a loading spinner here
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If not logged in, redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in, render children
  return <>{children}</>;
};

export default AdminLoginCheck;
