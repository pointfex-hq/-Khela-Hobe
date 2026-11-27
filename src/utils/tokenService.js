import { STORAGE_KEYS } from '../constants/config';

/**
 * JWT Token Storage and Lifecycle Management
 */
export const tokenService = {
  getAccessToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  setAccessToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
    } catch (err) {
      console.error('Failed to set access token', err);
    }
  },

  getRefreshToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  setRefreshToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch (err) {
      console.error('Failed to set refresh token', err);
    }
  },

  setTokens: (accessToken, refreshToken) => {
    tokenService.setAccessToken(accessToken);
    if (refreshToken) {
      tokenService.setRefreshToken(refreshToken);
    }
  },

  clearTokens: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (err) {
      console.error('Failed to clear tokens', err);
    }
  },

  /**
   * Basic JWT expiry check without external library
   */
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false; // Mock token or non-standard format
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp < nowInSeconds;
    } catch {
      return false;
    }
  },
};
