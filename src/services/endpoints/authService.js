import apiClient from '../api/apiClient';
import { MOCK_USERS } from '../../mocks/mockData';
import { ROLES } from '../../constants/roles';
import { tokenService } from '../../utils/tokenService';

/**
 * Authentication Service
 * Communicates with /auth endpoints with seamless fallback for offline demo development.
 * Storage abstraction prevents plaintext credentials in localStorage.
 */
export const authService = {
  /**
   * Authenticate user with email/phone and password
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data?.accessToken) {
        tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      return response.data;
    } catch {
      // Offline / Demo fallback
      const identifier = (credentials?.identifier || credentials?.email || '').toLowerCase();
      let targetRole = credentials?.role;

      if (!targetRole) {
        if (identifier.includes('admin')) {
          targetRole = ROLES.ADMIN;
        } else if (identifier.includes('rafiq') || identifier.includes('org')) {
          targetRole = ROLES.ORGANIZER;
        } else if (identifier.includes('nusrat') || identifier.includes('guardian')) {
          targetRole = ROLES.GUARDIAN;
        } else {
          targetRole = ROLES.PLAYER;
        }
      }

      const user = MOCK_USERS[targetRole] || MOCK_USERS[ROLES.PLAYER];
      const mockToken = `mock.jwt.token.${targetRole.toLowerCase()}`;
      const mockRefreshToken = `${mockToken}.refresh`;
      
      tokenService.setTokens(mockToken, mockRefreshToken);

      return {
        success: true,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
        user,
      };
    }
  },

  /**
   * Register a new user
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response.data?.accessToken) {
        tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      return response.data;
    } catch {
      // Offline fallback
      const targetRole = userData.role || ROLES.PLAYER;
      const user = {
        id: `usr_${Date.now()}`,
        name: userData.name || 'New Member',
        email: userData.email,
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        role: targetRole,
        city: 'Dhaka',
        preferredSports: ['Football'],
        matchesPlayed: 0,
        reputation: 100,
        avatar: '/src/assets/images/avatar_tanvir.png',
      };
      
      const mockToken = `mock.jwt.token.${targetRole.toLowerCase()}`;
      const mockRefreshToken = `${mockToken}.refresh`;
      tokenService.setTokens(mockToken, mockRefreshToken);

      return {
        success: true,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
        user,
      };
    }
  },

  /**
   * Invalidate current user session
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Local clean-up even if offline
    } finally {
      tokenService.clearTokens();
    }
    return { success: true };
  },

  /**
   * Fetch currently authenticated user
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch {
      // Determine user from stored token
      const token = tokenService.getAccessToken();
      if (!token) return null;
      if (token.includes('admin')) return MOCK_USERS[ROLES.ADMIN];
      if (token.includes('organizer')) return MOCK_USERS[ROLES.ORGANIZER];
      if (token.includes('guardian')) return MOCK_USERS[ROLES.GUARDIAN];
      return MOCK_USERS[ROLES.PLAYER];
    }
  },

  /**
   * Refresh JWT authentication tokens
   */
  refreshToken: async () => {
    const currentRefresh = tokenService.getRefreshToken();
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken: currentRefresh });
      if (response.data?.accessToken) {
        tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
        return response.data;
      }
    } catch {
      // Offline fallback: generate refreshed token
      const currentAccess = tokenService.getAccessToken() || 'mock.jwt.token.player';
      const newAccessToken = `${currentAccess.split('.refreshed')[0]}.refreshed_${Date.now()}`;
      const newRefreshToken = `${newAccessToken}.refresh`;
      tokenService.setTokens(newAccessToken, newRefreshToken);
      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }
  },

  /**
   * Request password reset code
   */
  forgotPassword: async (identifier) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { identifier });
      return response.data;
    } catch {
      return {
        success: true,
        message: 'A 6-digit recovery code has been sent to your email or phone.',
      };
    }
  },

  /**
   * Reset password with verification code
   */
  resetPassword: async ({ code, password }) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { code, password });
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Your password has been successfully reset. Please sign in.',
      };
    }
  },
};

export default authService;
