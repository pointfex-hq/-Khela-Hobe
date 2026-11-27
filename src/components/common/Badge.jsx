import React from 'react';

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  hasDot = false,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-primary/15 text-primary border-primary/30',
    secondary: 'bg-secondary/15 text-secondary border-secondary/30',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    error: 'bg-error/15 text-error border-error/30',
    neutral: 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted border-light-border dark:border-dark-border',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    neutral: 'bg-light-muted dark:bg-dark-muted',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold rounded-full',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-full',
    lg: 'px-3 py-1.5 text-sm font-semibold rounded-full',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 border font-label tabular-nums
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${className}
      `}
    >
      {hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.primary}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
