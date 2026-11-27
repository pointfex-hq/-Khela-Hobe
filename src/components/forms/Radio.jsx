import React, { forwardRef } from 'react';

export const Radio = forwardRef(
  ({ label, sublabel, id, name, value, checked, onChange, disabled, className = '', ...props }, ref) => {
    const radioId = id || `${name}-${value}`;

    return (
      <label
        htmlFor={radioId}
        className={`
          flex items-start gap-3 p-3 rounded-lg border transition-state cursor-pointer select-none
          ${
            checked
              ? 'bg-light-surface-elevated dark:bg-dark-surface-elevated border-primary ring-1 ring-primary'
              : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border hover:border-primary/60'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          ${className}
        `}
      >
        <input
          ref={ref}
          id={radioId}
          name={name}
          type="radio"
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="mt-0.5 w-4 h-4 text-primary bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border focus:ring-primary focus:ring-2"
          {...props}
        />
        <div className="flex flex-col">
          <span className="font-title text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
            {label}
          </span>
          {sublabel && (
            <span className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
