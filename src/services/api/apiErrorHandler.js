import toast from 'react-hot-toast';

/**
 * Standardized HTTP Response & Error Handler
 * Safely parses REST errors without crashing UI components.
 */
export const handleApiError = (error, options = { showToast: false }) => {
  let message = 'An unexpected server issue occurred. Please try again.';
  let statusCode = 500;
  let validationErrors = null;

  if (error.response) {
    statusCode = error.response.status;
    const data = error.response.data;

    // Extract message from standard backend shapes
    if (data?.message) {
      message = data.message;
    } else if (typeof data === 'string') {
      message = data;
    }

    // Extract validation dictionary
    if (data?.errors) {
      validationErrors = data.errors;
    }

    switch (statusCode) {
      case 400:
        message = data?.message || 'Invalid request payload or malformed query.';
        break;
      case 401:
        message = 'Your session has expired. Please sign in again.';
        break;
      case 403:
        message = 'Access restricted: You do not possess the required platform role.';
        break;
      case 404:
        message = data?.message || 'The requested resource or match was not found.';
        break;
      case 409:
        message = data?.message || 'Resource conflict: This match slot or entry is already taken.';
        break;
      case 422:
        message = data?.message || 'Validation error: Please review highlighted form fields.';
        break;
      case 500:
      case 502:
      case 503:
        message = 'Server encountered an issue. Our engineering team has been notified.';
        break;
      default:
        break;
    }
  } else if (error.request) {
    // Network disconnection or backend unreachable
    statusCode = 0;
    message = 'Unable to connect to Khela Hobe servers. Please check your internet connection.';
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

export const apiErrorHandler = {
  handle: handleApiError,
};

export default apiErrorHandler;
