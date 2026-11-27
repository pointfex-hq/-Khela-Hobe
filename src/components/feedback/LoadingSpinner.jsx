import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export const LoadingSpinner = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <FontAwesomeIcon
        icon={faSpinner}
        className={`animate-spin text-primary ${sizeClasses[size] || sizeClasses.md}`}
      />
      {label && (
        <span className="sr-only font-label text-xs text-light-muted dark:text-dark-muted">
          {label}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
