
import { useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isSuperAdmin } from '@/utils/auth';
import { ShieldCheck } from 'lucide-react';

interface SuperAdminRouteProps {
  children: ReactNode;
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const superAdminStatus = isSuperAdmin();
        setIsAuthorized(superAdminStatus);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthorized === null) {
    // Still loading
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-lg font-medium">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? (
    <>{children}</>
  ) : (
    <Navigate to="/admin" replace />
  );
};

export default SuperAdminRoute;
