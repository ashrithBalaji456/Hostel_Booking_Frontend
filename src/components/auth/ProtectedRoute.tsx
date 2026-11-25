import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/api';

export function getRoleHome(role?: UserRole): string {
  if (role === 'PROPERTY_OWNER') return '/owner';
  if (role === 'ADMIN') return '/admin';
  return '/';
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <Outlet />;
}

/**
 * Isolates public and customer-only booking pages from PROPERTY_OWNER and ADMIN sessions.
 * Owners and admins are redirected to their dedicated workspace.
 */
export function CustomerOrPublicRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user && (user.role === 'PROPERTY_OWNER' || user.role === 'ADMIN')) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <Outlet />;
}
