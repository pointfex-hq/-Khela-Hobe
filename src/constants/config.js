/**
 * Environment and Global Application Configuration
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API !== 'false',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'khela_hobe_access_token',
  REFRESH_TOKEN: 'khela_hobe_refresh_token',
  CURRENT_USER: 'khela_hobe_current_user',
  THEME_MODE: 'khela_hobe_theme_preference',
};

export const API_CONFIG = {
  TIMEOUT_MS: parseInt(import.meta.env.VITE_API_TIMEOUT || '15000', 10),
  RETRY_COUNT: 1,
};
