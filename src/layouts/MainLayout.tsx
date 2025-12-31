
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

type MainLayoutProps = {
  children: ReactNode;
  requireAuth?: boolean;
  adminOnly?: boolean;
  superadminOnly?: boolean;
};

const MainLayout = ({ children, requireAuth = false, adminOnly = false, superadminOnly = false }: MainLayoutProps) => {
  const { user, loading, isAdmin, isSuperadmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nectarine-500"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (superadminOnly && !isSuperadmin) {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
};

export default MainLayout;
