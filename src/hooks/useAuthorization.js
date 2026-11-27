import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS, ROLES } from '../constants/roles';

/**
 * Authorization Hook
 * Separates access control, roles, and permissions from authentication.
 */
export const useAuthorization = () => {
  const { role, roles = [], isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);
  const userRoles = roles.length > 0 ? roles : role ? [role] : [];

  const hasRole = (requiredRole) => {
    if (!isAuth || userRoles.length === 0) return false;
    return userRoles.includes(requiredRole);
  };

  const hasAnyRole = (allowedRoles = []) => {
    if (!isAuth || userRoles.length === 0) return false;
    if (allowedRoles.length === 0) return true;
    return userRoles.some((r) => allowedRoles.includes(r));
  };

  const hasPermission = (permission) => {
    if (!isAuth || userRoles.length === 0) return false;
    return userRoles.some((r) => (ROLE_PERMISSIONS[r] || []).includes(permission));
  };

  const isPlayer = hasRole(ROLES.PLAYER);
  const isOrganizer = hasRole(ROLES.ORGANIZER);
  const isGuardian = hasRole(ROLES.GUARDIAN);
  const isAdmin = hasRole(ROLES.ADMIN);

  return {
    role,
    roles: userRoles,
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
