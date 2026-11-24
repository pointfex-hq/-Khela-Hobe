import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authService } from '../services/endpoints/authService';
import { tokenService } from '../utils/tokenService';
import { ROLES } from '../constants/roles';
import { MOCK_USERS } from '../mocks/mockData';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenService.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  // Load initial session on startup
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = tokenService.getAccessToken();
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser();
          if (isMounted) {
            setUser(userData);
          }
        } catch (err) {
          console.warn('Session verification failed, logging out', err);
          tokenService.clearTokens();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with credentials
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.user) {
        setUser(result.user);
        setToken(result.accessToken);
        toast.success(`Welcome back, ${result.user.name}`);
        return { success: true, user: result.user };
      }
      throw new Error(result.message || 'Login failed');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const result = await authService.register(userData);
      if (result.user) {
        setUser(result.user);
        setToken(result.accessToken);
        toast.success(`Welcome to Khela Hobe, ${result.user.name}!`);
        return { success: true, user: result.user };
      }
      throw new Error(result.message || 'Registration failed');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log out current user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      toast.success('Signed out successfully');
    }
  }, []);

  /**
   * Get current user (resolves existing state or re-fetches)
   */
  const getCurrentUser = useCallback(async () => {
    if (user) return user;
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }, [user]);

  /**
   * Refresh active JWT access token
   */
  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      if (result?.accessToken) {
        setToken(result.accessToken);
        return result.accessToken;
      }
      return null;
    } catch (err) {
      console.error('Failed to refresh authentication token', err);
      throw err;
    }
  }, []);

  /**
   * Check if user is authenticated (callable function)
   */
  const isAuthenticated = useCallback(() => {
    return Boolean(user && token);
  }, [user, token]);

  /**
   * Fast Demo Workspace Switcher (Player, Organizer, Guardian, Admin)
   */
  const switchDemoRole = useCallback((roleName) => {
    const targetUser = MOCK_USERS[roleName] || MOCK_USERS[ROLES.PLAYER];
    const mockToken = `mock.jwt.token.${roleName.toLowerCase()}`;
    tokenService.setTokens(mockToken, `${mockToken}.refresh`);
    setUser(targetUser);
    setToken(mockToken);
    toast.success(`Active workspace switched to ${roleName}`);
    return targetUser;
  }, []);

  /**
   * Send password reset request
   */
  const forgotPassword = useCallback(async (identifier) => {
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(identifier);
      toast.success(res.message || 'Verification code sent');
      return { success: true, ...res };
    } catch (err) {
      toast.error(err.message || 'Failed to send reset code');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Complete password reset
   */
  const resetPassword = useCallback(async ({ code, password }) => {
    setIsLoading(true);
    try {
      const res = await authService.resetPassword({ code, password });
      toast.success(res.message || 'Password successfully updated');
      return { success: true, ...res };
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isAuthDirect = Boolean(user && token);

  const value = useMemo(() => {
    // Attach boolean convenience properties directly onto isAuthenticated function
    // so `isAuthenticated()` and `if (isAuthenticated.value)` both work.
    const authFn = () => isAuthDirect;
    authFn.valueOf = () => isAuthDirect;
    authFn.toString = () => String(isAuthDirect);
    authFn.value = isAuthDirect;

    return {
      user,
      token,
      role: user?.role || null,
      isLoggedIn: isAuthDirect,
      isAuth: isAuthDirect,
      isAuthenticated: authFn,
      isLoading,
      login,
      register,
      logout,
      getCurrentUser,
      refreshToken,
      switchDemoRole,
      forgotPassword,
      resetPassword,
    };
  }, [
    user,
    token,
    isAuthDirect,
    isLoading,
    login,
    register,
    logout,
    getCurrentUser,
    refreshToken,
    switchDemoRole,
    forgotPassword,
    resetPassword,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
