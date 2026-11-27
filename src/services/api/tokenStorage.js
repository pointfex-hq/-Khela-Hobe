import { STORAGE_KEYS } from '../../constants/config';

/**
 * Validates that a token string is non-empty and not a serialized placeholder.
 */
export function isValidToken(token) {
  return (
    typeof token === 'string' &&
    token !== 'undefined' &&
    token !== 'null' &&
    token.length > 20
  );
}

/**
 * Replaceable Token Storage Interface
 * Designed to decouple storage medium (localStorage, secure cookies, in-memory)
 * from API clients and interceptors.
 */
class TokenStorage {
  constructor(storage = typeof window !== 'undefined' ? window.localStorage : null) {
    this.storage = storage;
  }

  getAccessToken() {
    try {
      const token = this.storage?.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
      return isValidToken(token) ? token : null;
    } catch (err) {
      console.warn('[TokenStorage] Unable to read access token from storage:', err);
      return null;
    }
  }

  setAccessToken(token) {
    try {
      if (isValidToken(token)) {
        this.storage?.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      } else {
        this.storage?.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
    } catch (err) {
      console.error('[TokenStorage] Failed to save access token:', err);
    }
  }

  getRefreshToken() {
    try {
      const token = this.storage?.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
      return isValidToken(token) ? token : null;
    } catch (err) {
      console.warn('[TokenStorage] Unable to read refresh token from storage:', err);
      return null;
    }
  }

  setRefreshToken(token) {
    try {
      if (isValidToken(token)) {
        this.storage?.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      } else {
        this.storage?.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch (err) {
      console.error('[TokenStorage] Failed to save refresh token:', err);
    }
  }

  setTokens(accessToken, refreshToken) {
    this.setAccessToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  clearTokens() {
    try {
      this.storage?.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      this.storage?.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (err) {
      console.error('[TokenStorage] Failed to clear authentication tokens:', err);
    }
  }

  isTokenExpired(token) {
    if (!isValidToken(token)) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false; // Non-JWT token format
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp < nowInSeconds;
    } catch {
      return false;
    }
  }
}

export const tokenStorage = new TokenStorage();
export default tokenStorage;
