import React from 'react';

export const FormField = ({ label, error, helperText, required, children, id }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="font-label text-xs sm:text-sm font-semibold text-light-on-background dark:text-dark-on-background">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="font-label text-xs text-error mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="font-label text-xs text-light-muted dark:text-dark-muted mt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
};

export default FormField;
