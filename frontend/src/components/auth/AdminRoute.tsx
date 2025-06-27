
import { useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdmin } from '@/utils/auth';
import { ShieldCheck } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const adminStatus = isAdmin();
        setIsAuthorized(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
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
          <p className="mt-4 text-lg font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default AdminRoute;
