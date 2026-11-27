import apiClient from '../api/apiClient';
import { tokenService } from '../../utils/tokenService';
import { unwrapEnvelope, normalizeUser } from '../../utils/dtoMappers';

/**
 * Authentication Service — strictly backed by /auth REST endpoints
 */
export const authService = {
  login: async (credentials) => {
    const email = (credentials?.email || credentials?.identifier || '').trim();
    const password = credentials?.password || '';

    const response = await apiClient.post('/auth/login', { email, password });
    const session = unwrapEnvelope(response);

    if (!session?.accessToken || !session?.user) {
      throw new Error('Login response missing accessToken or user');
    }

    tokenService.setTokens(session.accessToken, session.refreshToken);
    return {
      success: true,
      ...session,
      user: normalizeUser(session.user),
    };
  },

  register: async (userData) => {
    const payload = {
      fullName: (userData.fullName || userData.name || '').trim(),
      email: (userData.email || '').trim(),
      password: userData.password,
      role: userData.role === 'ORGANIZER' ? 'ORGANIZER' : 'PLAYER',
    };
    const rawPhone = (userData.phoneNumber || userData.phone || '').trim().replace(/[\s-]/g, '');
    if (rawPhone) {
      payload.phoneNumber = rawPhone;
    }

    const response = await apiClient.post('/auth/register', payload);
    const session = unwrapEnvelope(response);

    if (session?.accessToken) {
      tokenService.setTokens(session.accessToken, session.refreshToken);
    }

    return {
      success: true,
      ...session,
      user: session?.user ? normalizeUser(session.user) : null,
    };
  },

  verifyEmailOtp: async ({ code, email } = {}) => {
    const response = await apiClient.post('/auth/verify-email', { code, ...(email ? { email } : {}) });
    const data = unwrapEnvelope(response);
    return {
      success: true,
      ...data,
      user: data?.user ? normalizeUser(data.user) : null,
    };
  },

  resendEmailOtp: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', email ? { email } : {});
    return unwrapEnvelope(response);
  },

  logout: async () => {
    try {
      if (tokenService.getAccessToken()) {
        await apiClient.post('/auth/logout');
      }
    } catch {
      // Clear local session regardless of network outcome
    } finally {
      tokenService.clearTokens();
    }
    return { success: true };
  },

  getCurrentUser: async () => {
    const token = tokenService.getAccessToken();
    if (!token) return null;
    const response = await apiClient.get('/auth/me');
    return normalizeUser(unwrapEnvelope(response));
  },

  refreshToken: async () => {
    const currentRefresh = tokenService.getRefreshToken();
    if (!currentRefresh) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken: currentRefresh });
    const session = unwrapEnvelope(response);

    if (!session?.accessToken) {
      throw new Error('Refresh response missing accessToken');
    }

    tokenService.setTokens(session.accessToken, session.refreshToken || currentRefresh);
    return {
      success: true,
      ...session,
      user: session.user ? normalizeUser(session.user) : undefined,
    };
  },

  forgotPassword: async (identifier) => {
    const response = await apiClient.post('/auth/forgot-password', { identifier });
    return unwrapEnvelope(response);
  },

  resetPassword: async ({ code, password }) => {
    const response = await apiClient.post('/auth/reset-password', { code, password });
    return unwrapEnvelope(response);
  },

  getGoogleAuthUrl: async ({ mode = 'login', role, returnTo } = {}) => {
    const params = { mode };
    if (role) params.role = role;
    if (returnTo) params.returnTo = returnTo;
    const response = await apiClient.get('/auth/google/url', { params });
    return unwrapEnvelope(response);
  },

  completeGoogleLogin: async (code) => {
    const response = await apiClient.post('/auth/google/exchange', { code });
    const session = unwrapEnvelope(response);

    if (!session?.accessToken || !session?.user) {
      throw new Error('Google authentication failed to return session tokens');
    }

    tokenService.setTokens(session.accessToken, session.refreshToken);
    return {
      success: true,
      ...session,
      user: normalizeUser(session.user),
    };
  },

  unlinkGoogleAccount: async () => {
    const response = await apiClient.delete('/auth/google/link');
    return {
      success: true,
      user: normalizeUser(unwrapEnvelope(response)),
    };
  },
};

export default authService;
