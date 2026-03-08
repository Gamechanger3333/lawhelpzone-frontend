import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, initialized, loading } = useAppSelector((s) => s.auth);

  // Show loader while auth state is initializing or loading
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if user not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to role-specific dashboard if role not allowed
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={`/dashboard/${role}`} replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;