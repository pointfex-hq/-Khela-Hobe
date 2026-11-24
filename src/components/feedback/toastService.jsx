import toast from 'react-hot-toast';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faCircleExclamation,
  faTriangleExclamation,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

export const showToast = {
  success: (message) => {
    return toast.success(message, {
      icon: <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-sm" />,
    });
  },
  error: (message) => {
    return toast.error(message, {
      icon: <FontAwesomeIcon icon={faCircleExclamation} className="text-error text-sm" />,
    });
  },
  warning: (message) => {
    return toast(message, {
      icon: <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning text-sm" />,
    });
  },
  info: (message) => {
    return toast(message, {
      icon: <FontAwesomeIcon icon={faInfoCircle} className="text-secondary text-sm" />,
    });
  },
};

export const toastService = showToast;
export default showToast;
