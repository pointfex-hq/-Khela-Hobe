import React from 'react';

export const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  sublabel,
  id,
  name,
  className = '',
}) => {
  const switchId = id || name;

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${className}`}>
      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className="font-title text-sm font-semibold text-light-on-surface dark:text-dark-on-surface cursor-pointer"
              onClick={handleToggle}
            >
              {label}
            </label>
          )}
          {sublabel && (
            <span className="font-body text-xs text-light-muted dark:text-dark-muted">
              {sublabel}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-background
          ${checked ? 'bg-primary' : 'bg-light-border dark:bg-dark-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-dark-background
            shadow-md ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default Switch;
