import { ENV } from '../constants/config';

/**
 * Mock API Adapter Helper
 * Provides simulated latency, standardized envelope formatting,
 * and predictable error simulations for mock-to-API parity.
 */

export const isMockMode = () => {
  return ENV.USE_MOCK_API;
};

/**
 * Simulate network latency (0ms in test environment, 100-250ms in dev)
 */
export const mockDelay = (ms = 150) => {
  if (process.env.NODE_ENV === 'test') return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Standardize successful mock response envelope
 */
export const mockResponse = (data, meta = {}) => {
  return {
    success: true,
    data,
    statusCode: meta.statusCode || 200,
    message: meta.message || 'Operation completed successfully.',
    total: meta.total !== undefined ? meta.total : Array.isArray(data) ? data.length : undefined,
    ...meta,
  };
};

/**
 * Simulate a structured REST API error matching Axios error structure
 */
export const mockError = (message, statusCode = 400, validationErrors = null) => {
  const error = new Error(message);
  error.response = {
    status: statusCode,
    statusText: statusCode === 404 ? 'Not Found' : statusCode === 401 ? 'Unauthorized' : 'Bad Request',
    data: {
      success: false,
      message,
      statusCode,
      errors: validationErrors,
    },
  };
  return Promise.reject(error);
};
