import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

/**
 * Role-Based Protected Route Guard
 * Enforces authentication and authorization permissions.
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
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
    // Redirect to login while saving the intended destination
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Authenticated but unauthorized for this workspace
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children;
};

export default ProtectedRoute;
