import toast from 'react-hot-toast';

/**
 * Extract structured error info from Khela Hobe backend error envelope:
 * { success: false, error: { code, message, details }, timestamp }
 */
export function parseBackendError(error) {
  let message = 'An unexpected server issue occurred. Please try again.';
  let statusCode = 500;
  let errorCode = null;
  let validationErrors = null;

  if (error?.response) {
    statusCode = error.response.status;
    const body = error.response.data;
    const errObj = body?.error;

    if (errObj) {
      errorCode = errObj.code || null;
      if (errObj.message) {
        message = errObj.message;
      }
      if (Array.isArray(errObj.details) && errObj.details.length > 0) {
        validationErrors = errObj.details;
      }
    } else if (body?.message) {
      message = body.message;
    } else if (typeof body === 'string') {
      message = body;
    }

    if (!validationErrors && body?.errors) {
      validationErrors = body.errors;
    }

    // Only apply generic fallbacks when the backend did not supply a specific message
    const hasExplicitMessage = Boolean(errObj?.message || body?.message);
    if (!hasExplicitMessage) {
      switch (statusCode) {
        case 400:
          message = 'Invalid request payload or malformed query.';
          break;
        case 401:
          message = 'Your session has expired. Please sign in again.';
          break;
        case 403:
          message = 'Access restricted: You do not possess the required platform role.';
          break;
        case 404:
          message = 'The requested resource or match was not found.';
          break;
        case 409:
          message = 'Resource conflict: This match slot or entry already exists.';
          break;
        case 422:
          message = 'Validation error: Please review highlighted form fields.';
          break;
        case 500:
        case 502:
        case 503:
          message = 'Server encountered an issue. Please try again shortly.';
          break;
        default:
          break;
      }
    }
  } else if (error?.request) {
    statusCode = 0;
    message = 'Unable to connect to Khela Hobe servers. Please check your internet connection.';
  } else if (error?.message) {
    message = error.message;
  }

  return {
    success: false,
    code: errorCode,
    message,
    statusCode,
    validationErrors,
    originalError: error,
  };
}

/**
 * Standardized HTTP Response & Error Handler
 * Safely parses REST errors without crashing UI components.
 */
export const handleApiError = (error, options = { showToast: false }) => {
  const parsed = parseBackendError(error);

  if (options.showToast) {
    toast.error(parsed.message);
  }

  return parsed;
};

export const apiErrorHandler = {
  handle: handleApiError,
  parse: parseBackendError,
};

export default apiErrorHandler;
