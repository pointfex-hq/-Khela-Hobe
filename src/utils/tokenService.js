import { tokenStorage, isValidToken } from '../services/api/tokenStorage';

/**
 * JWT Token Storage and Lifecycle Management
 */
export const tokenService = {
  isValidToken,
  getAccessToken: () => tokenStorage.getAccessToken(),
  setAccessToken: (token) => tokenStorage.setAccessToken(token),
  getRefreshToken: () => tokenStorage.getRefreshToken(),
  setRefreshToken: (token) => tokenStorage.setRefreshToken(token),
  setTokens: (accessToken, refreshToken) => tokenStorage.setTokens(accessToken, refreshToken),
  clearTokens: () => tokenStorage.clearTokens(),
  isTokenExpired: (token) => tokenStorage.isTokenExpired(token),
};
