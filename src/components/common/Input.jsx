import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Reusable Form Input Field
 * Supports prefix icons, error states, and label styling.
 */
export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon,
      type = 'text',
      className = '',
      id,
      name,
      placeholder,
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background flex items-center justify-between">
            <span>
              {label} {required && <span className="text-error">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-light-muted dark:text-dark-muted pointer-events-none">
              <FontAwesomeIcon icon={icon} className="text-sm" />
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            className={`
              w-full py-2.5 rounded-md font-body text-sm
              bg-light-background dark:bg-dark-background
              border text-light-on-surface dark:text-dark-on-surface
              placeholder-light-muted dark:placeholder-dark-muted
              transition-colors duration-state-change
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary
              ${icon ? 'pl-10 pr-3.5' : 'px-3.5'}
              ${error ? 'border-error focus-visible:ring-error focus:border-error' : 'border-light-border dark:border-dark-border'}
              ${className}
            `}
            {...props}
          />
        </div>

        {error ? (
          <span className="font-label text-xs text-error mt-0.5" role="alert">
            {error}
          </span>
        ) : helperText ? (
          <span className="font-label text-xs text-light-muted dark:text-dark-muted mt-0.5">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
