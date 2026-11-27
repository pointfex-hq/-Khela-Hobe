import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

import { ROLES } from '../constants/roles';

/**
 * Role-Based Protected Route Guard
 * Enforces authentication and authorization permissions.
 */
export const ProtectedRoute = ({ children, allowedRoles = [], allowQuickMatchHost = false }) => {
  const { isAuthenticated, user, role, roles = [], isLoading } = useAuth();
  const location = useLocation();

  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-light-background dark:bg-dark-background">
        <LoadingSkeleton variant="card" count={1} className="w-full max-w-md" />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const userRoles = roles.length > 0 ? roles : role ? [role] : [];
  const guardianViaParentalControl =
    allowedRoles.includes(ROLES.GUARDIAN) && Boolean(user?.parentalControlEnabled);
  const hostViaVerifiedPlayer =
    allowQuickMatchHost && Boolean(user?.quickMatchHostEnabled);
  if (
    allowedRoles.length > 0 &&
    !guardianViaParentalControl &&
    !hostViaVerifiedPlayer &&
    !userRoles.some((r) => allowedRoles.includes(r))
  ) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
};

export default ProtectedRoute;
