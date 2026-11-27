import React, { forwardRef } from 'react';

export const Checkbox = forwardRef(({ label, id, name, error, className = '', ...props }, ref) => {
  const checkboxId = id || name;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={checkboxId} className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          ref={ref}
          id={checkboxId}
          name={name}
          type="checkbox"
          className={`
            w-4 h-4 rounded border-light-border dark:border-dark-border
            text-primary bg-light-background dark:bg-dark-background
            focus:ring-2 focus:ring-primary focus:ring-offset-1
            transition-colors duration-state-change cursor-pointer
            ${className}
          `}
          {...props}
        />
        {label && (
          <span className="font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface">
            {label}
          </span>
        )}
      </label>
      {error && <span className="font-label text-xs text-error">{error}</span>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
