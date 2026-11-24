import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTriangleExclamation,
  faCircleExclamation,
  faInfoCircle,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

export const Alert = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  const variantStyles = {
    info: {
      container: 'bg-primary/10 border-primary/30 text-light-on-background dark:text-dark-on-background',
      icon: faInfoCircle,
      iconColor: 'text-primary',
    },
    success: {
      container: 'bg-success/10 border-success/30 text-light-on-background dark:text-dark-on-background',
      icon: faCheckCircle,
      iconColor: 'text-success',
    },
    warning: {
      container: 'bg-warning/10 border-warning/30 text-light-on-background dark:text-dark-on-background',
      icon: faTriangleExclamation,
      iconColor: 'text-warning',
    },
    error: {
      container: 'bg-error/10 border-error/30 text-light-on-background dark:text-dark-on-background',
      icon: faCircleExclamation,
      iconColor: 'text-error',
    },
  };

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <div
      role="alert"
      className={`
        rounded-lg border p-4 flex items-start gap-3 transition-surface
        ${style.container} ${className}
      `}
    >
      <FontAwesomeIcon icon={style.icon} className={`text-base shrink-0 mt-0.5 ${style.iconColor}`} />

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-headline text-sm font-bold leading-snug">
            {title}
          </h4>
        )}
        <div className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-0.5">
          {children}
        </div>
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 p-1 text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors rounded"
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
        </button>
      )}
    </div>
  );
};

export default Alert;
