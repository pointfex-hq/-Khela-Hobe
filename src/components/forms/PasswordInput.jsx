import React, { forwardRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export const PasswordInput = forwardRef(
  (
    {
      label = 'Password',
      error,
      helperText,
      className = '',
      id,
      name = 'password',
      placeholder = 'Enter password',
      required = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || name;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background flex items-center justify-between"
          >
            <span>
              {label} {required && <span className="text-error">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-light-muted dark:text-dark-muted pointer-events-none">
            <FontAwesomeIcon icon={faLock} className="text-sm" />
          </span>

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            className={`
              w-full py-2.5 pl-10 pr-10 rounded-md font-body text-sm
              bg-light-background dark:bg-dark-background
              border text-light-on-surface dark:text-dark-on-surface
              placeholder-light-muted dark:placeholder-dark-muted
              transition-state
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary
              ${error ? 'border-error focus-visible:ring-error focus:border-error' : 'border-light-border dark:border-dark-border'}
              ${className}
            `}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors p-1 rounded"
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
          </button>
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

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
