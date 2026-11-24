import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS, ROLES } from '../constants/roles';

/**
 * Authorization Hook
 * Separates access control, roles, and permissions from authentication.
 */
export const useAuthorization = () => {
  const { user, role, isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const hasRole = (requiredRole) => {
    if (!isAuth || !role) return false;
    return role === requiredRole;
  };

  const hasAnyRole = (allowedRoles = []) => {
    if (!isAuth || !role) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(role);
  };

  const hasPermission = (permission) => {
    if (!isAuth || !role) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  };

  const isPlayer = role === ROLES.PLAYER;
  const isOrganizer = role === ROLES.ORGANIZER;
  const isGuardian = role === ROLES.GUARDIAN;
  const isAdmin = role === ROLES.ADMIN;

  return {
    role,
    isAuthenticated: isAuth,
    hasRole,
    hasAnyRole,
    hasPermission,
    isPlayer,
    isOrganizer,
    isGuardian,
    isAdmin,
  };
};

export default useAuthorization;
