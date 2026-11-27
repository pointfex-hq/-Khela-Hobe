import toast from 'react-hot-toast';
import { parseBackendError } from '../services/api/apiErrorHandler';

/**
 * Standardized API and Network Error Handler
 */
export const handleApiError = (error, options = { showToast: true }) => {
  const parsed = parseBackendError(error);

  if (options.showToast) {
    toast.error(parsed.message);
  }

  return parsed;
};
