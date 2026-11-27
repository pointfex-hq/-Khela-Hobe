import axios from 'axios';
import { ENV, API_CONFIG, STORAGE_KEYS } from '../../constants/config';
import { tokenStorage, isValidToken } from './tokenStorage';
import { handleApiError } from './apiErrorHandler';

/**
 * Centralized Axios Instance for Khela Hobe REST API
 */
export const axiosClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error || new Error('Session refresh failed'));
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
};

const redirectToLogin = () => {
  tokenStorage.clearTokens();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Request Interceptor: Attach Bearer JWT token when valid
axiosClient.interceptors.request.use(
  (config) => {
    const rawToken =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        : null;

    config.headers = config.headers ?? {};

    if (isValidToken(rawToken)) {
      config.headers.Authorization = `Bearer ${rawToken}`;
    } else {
      if (rawToken !== null) {
        // Clean up corrupted placeholders like "undefined" or "null"
        tokenStorage.clearTokens();
      }
      delete config.headers.Authorization;
    }

    // Allow multipart/form-data for FormData without overriding boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Refresh on 401, bounce on /auth/me 401/403, normalize errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const reqUrl = originalRequest?.url || '';

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !reqUrl.includes('/auth/refresh') &&
      !reqUrl.includes('/auth/login') &&
      !reqUrl.includes('/auth/register')
    ) {
      originalRequest._retry = true;
      const refreshToken = tokenStorage.getRefreshToken();

      if (!isValidToken(refreshToken)) {
        redirectToLogin();
        return Promise.reject(handleApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const refreshRes = await axios.post(
          `${ENV.API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
        );

        const payload = refreshRes.data?.data ?? refreshRes.data;
        const newAccess = payload?.accessToken;
        const newRefresh = payload?.refreshToken ?? refreshToken;

        if (!isValidToken(newAccess)) {
          throw new Error('Refresh response missing valid accessToken');
        }

        tokenStorage.setTokens(newAccess, newRefresh);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        flushQueue(null, newAccess);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(handleApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    // Direct 401/403 on /auth/me — clear tokens and bounce to /login
    if ((status === 401 || status === 403) && reqUrl.includes('/auth/me')) {
      redirectToLogin();
    }

    return Promise.reject(handleApiError(error));
  }
);

/**
 * Envelope-returning helpers matching the Frontend Alignment Guide:
 * api.get(url) returns ApiResponse<T> ({ success, data, timestamp })
 */
export const api = {
  get: (url, cfg) => axiosClient.get(url, cfg).then((r) => r.data),
  post: (url, data, cfg) => axiosClient.post(url, data, cfg).then((r) => r.data),
  patch: (url, data, cfg) => axiosClient.patch(url, data, cfg).then((r) => r.data),
  put: (url, data, cfg) => axiosClient.put(url, data, cfg).then((r) => r.data),
  delete: (url, cfg) => axiosClient.delete(url, cfg).then((r) => r.data),
};

export default axiosClient;
