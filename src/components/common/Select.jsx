import React, { forwardRef } from 'react';

export const Select = forwardRef(
  ({ label, error, helperText, options = [], className = '', id, name, required = false, ...props }, ref) => {
    const selectId = id || name;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background">
            {label} {required && <span className="text-error">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          name={name}
          className={`
            w-full px-3.5 py-2.5 rounded-md font-body text-sm
            bg-light-background dark:bg-dark-background
            border text-light-on-surface dark:text-dark-on-surface
            transition-colors duration-state-change
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary
            ${error ? 'border-error focus-visible:ring-error' : 'border-light-border dark:border-dark-border'}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface">
              {opt.label}
            </option>
          ))}
        </select>

        {error ? (
          <span className="font-label text-xs text-error mt-0.5">{error}</span>
        ) : helperText ? (
          <span className="font-label text-xs text-light-muted dark:text-dark-muted mt-0.5">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
