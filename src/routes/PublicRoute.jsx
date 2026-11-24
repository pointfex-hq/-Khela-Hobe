import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME_ROUTES, ROLES } from '../constants/roles';

/**
 * Public route guard that optionally redirects already logged-in users away from auth pages
 */
export const PublicRoute = ({ children, restricted = false }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  if (restricted && isAuth) {
    const from = location.state?.from?.pathname || (role ? ROLE_HOME_ROUTES[role] : '/');
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;
