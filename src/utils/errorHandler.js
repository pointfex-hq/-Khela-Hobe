import toast from 'react-hot-toast';

/**
 * Standardized API and Network Error Handler
 */
export const handleApiError = (error, options = { showToast: true }) => {
  let message = 'An unexpected error occurred. Please try again.';
  let statusCode = 500;
  let validationErrors = null;

  if (error.response) {
    // The request was made and the server responded with a status code
    statusCode = error.response.status;
    const data = error.response.data;

    if (data?.message) {
      message = data.message;
    } else if (typeof data === 'string') {
      message = data;
    }

    if (data?.errors) {
      validationErrors = data.errors;
    }

    if (statusCode === 401) {
      message = 'Session expired. Please sign in again.';
    } else if (statusCode === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (statusCode === 404) {
      message = data?.message || 'The requested resource was not found.';
    } else if (statusCode >= 500) {
      message = 'Server encountered a problem. Please try again shortly.';
    }
  } else if (error.request) {
    // The request was made but no response was received
    message = 'Unable to reach the server. Please check your network connection.';
    statusCode = 0;
  } else if (error.message) {
    message = error.message;
  }

  if (options.showToast) {
    toast.error(message);
  }

  return {
    success: false,
    message,
    statusCode,
    validationErrors,
    originalError: error,
  };
};
