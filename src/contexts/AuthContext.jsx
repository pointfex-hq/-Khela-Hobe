import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authService } from '../services/endpoints/authService';
import { tokenService } from '../utils/tokenService';
import { normalizeUser } from '../utils/dtoMappers';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const hasToken = tokenService.getAccessToken();
    return hasToken ? useAppStore.getState().cachedUser : null;
  });
  const [token, setToken] = useState(() => tokenService.getAccessToken());
  const [isLoading, setIsLoading] = useState(() => {
    const hasToken = tokenService.getAccessToken();
    return Boolean(hasToken && !useAppStore.getState().cachedUser);
  });

  // Load initial session on startup ONLY when a valid token exists;
  // use browser cache immediately when fresh so every route mount doesn't hit DB.
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = tokenService.getAccessToken();
      if (!storedToken) {
        tokenService.clearTokens();
        useAppStore.getState().clearCachedUser();
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      const { cachedUser, userCachedAt } = useAppStore.getState();
      const cacheFresh = cachedUser && userCachedAt && Date.now() - userCachedAt < 5 * 60 * 1000;
      if (cacheFresh && isMounted) {
        setUser(cachedUser);
        setToken(storedToken);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        if (isMounted) {
          setUser(userData);
          useAppStore.getState().setCachedUser(userData);
          setToken(tokenService.getAccessToken());
        }
      } catch (err) {
        console.warn('Session verification failed, clearing session:', err?.message || err);
        tokenService.clearTokens();
        useAppStore.getState().clearCachedUser();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with email & password
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result?.user && result?.accessToken) {
        const normalized = normalizeUser(result.user);
        setUser(normalized);
        useAppStore.getState().setCachedUser(normalized);
        useAppStore.getState().invalidateMatches({ refetch: false });
        setToken(result.accessToken);
        toast.success(`Welcome back, ${normalized.name || normalized.fullName}`);
        return { success: true, user: normalized };
      }
      throw new Error(result?.message || 'Login failed');
    } catch (err) {
      const msg = err?.message || 'Invalid email or password';
      toast.error(msg);
      return { success: false, error: msg };
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
      if (result?.user && result?.accessToken) {
        const normalized = normalizeUser(result.user);
        setUser(normalized);
        useAppStore.getState().setCachedUser(normalized);
        useAppStore.getState().invalidateMatches({ refetch: false });
        setToken(result.accessToken);
        toast.success(`Welcome to Khela Hobe, ${normalized.name || normalized.fullName}!`);
        return { success: true, user: normalized };
      }
      if (result?.success) {
        toast.success('Registration successful. Please login.');
        return { success: true, user: null };
      }
      throw new Error(result?.message || 'Registration failed');
    } catch (err) {
      const msg = err?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
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
      tokenService.clearTokens();
      useAppStore.getState().clearCachedUser();
      useAppStore.getState().invalidateMatches({ refetch: false });
      setUser(null);
      setToken(null);
      toast.success('Signed out successfully');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  /**
   * Update in-memory user after profile edits
   */
  const updateUserState = useCallback((updatedUser) => {
    if (!updatedUser) return;
    setUser((prev) => {
      const merged = normalizeUser({ ...(prev || {}), ...updatedUser });
      useAppStore.getState().setCachedUser(merged);
      return merged;
    });
  }, []);

  /**
   * Get current user (resolves existing state or re-fetches if valid token exists)
   */
  const getCurrentUser = useCallback(async () => {
    if (user) return user;
    if (!tokenService.getAccessToken()) return null;
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
        if (result.user) {
          setUser(normalizeUser(result.user));
        }
        return result.accessToken;
      }
      return null;
    } catch (err) {
      console.error('Failed to refresh authentication token', err);
      throw err;
    }
  }, []);

  /**
   * Send password reset request
   */
  const forgotPassword = useCallback(async (identifier) => {
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(identifier);
      toast.success(res?.message || 'Verification code sent');
      return { success: true, ...res };
    } catch (err) {
      const msg = err?.message || 'Failed to send reset code';
      toast.error(msg);
      return { success: false, error: msg };
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
      toast.success(res?.message || 'Password successfully updated');
      return { success: true, ...res };
    } catch (err) {
      const msg = err?.message || 'Failed to reset password';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Complete Google OAuth sign-in from one-time callback code
   */
  const completeGoogleLogin = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const result = await authService.completeGoogleLogin(code);
      if (result?.user && result?.accessToken) {
        const normalized = normalizeUser(result.user);
        setUser(normalized);
        useAppStore.getState().setCachedUser(normalized);
        useAppStore.getState().invalidateMatches({ refetch: false });
        setToken(result.accessToken);
        toast.success(`Signed in as ${normalized.name || normalized.fullName}`);
        return { success: true, user: normalized };
      }
      throw new Error('Google login failed');
    } catch (err) {
      const msg = err?.message || 'Google sign-in failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isAuthDirect = Boolean(user && token && tokenService.isValidToken(token));

  const value = useMemo(() => {
    const authFn = () => isAuthDirect;
    authFn.valueOf = () => isAuthDirect;
    authFn.toString = () => String(isAuthDirect);
    authFn.value = isAuthDirect;

    return {
      user,
      token,
      role: user?.role || null,
      roles: user?.roles || (user?.role ? [user.role] : []),
      isLoggedIn: isAuthDirect,
      isAuth: isAuthDirect,
      isAuthenticated: authFn,
      isLoading,
      login,
      register,
      logout,
      updateUserState,
      getCurrentUser,
      refreshToken,
      forgotPassword,
      resetPassword,
      completeGoogleLogin,
    };
  }, [
    user,
    token,
    isAuthDirect,
    isLoading,
    login,
    register,
    logout,
    updateUserState,
    getCurrentUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    completeGoogleLogin,
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
