import React, { forwardRef } from 'react';

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      rows = 4,
      className = '',
      id,
      name,
      placeholder,
      required = false,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
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
            {maxLength && (
              <span className="text-xs font-normal text-light-muted dark:text-dark-muted">
                {typeof value === 'string' ? value.length : 0}/{maxLength}
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          name={name}
          rows={rows}
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          className={`
            w-full p-3.5 rounded-md font-body text-sm
            bg-light-background dark:bg-dark-background
            border text-light-on-surface dark:text-dark-on-surface
            placeholder-light-muted dark:placeholder-dark-muted
            transition-state resize-y
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary
            ${error ? 'border-error focus-visible:ring-error focus:border-error' : 'border-light-border dark:border-dark-border'}
            ${className}
          `}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

export default Textarea;
