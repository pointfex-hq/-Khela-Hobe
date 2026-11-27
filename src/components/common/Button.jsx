import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * Reusable Athletic Button Component
 * Supports primary, secondary, outline, danger, icon-only, and loading states.
 * Respects 120ms interaction transitions and strict focus rings.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ariaLabel,
  className = '',
  onClick,
  ...props
}) => {
  const isIconOnly = !children && icon;

  const baseClasses =
    'inline-flex items-center justify-center font-label font-semibold rounded-md transition-state select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = isIconOnly
    ? {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
      }
    : {
        sm: 'px-3 py-1.5 text-xs tracking-wide',
        md: 'px-4 py-2 text-sm tracking-normal',
        lg: 'px-6 py-3 text-base tracking-normal',
      };

  const variantClasses = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-hover active:bg-[#9bd432] shadow-sm',
    secondary:
      'bg-secondary text-on-secondary hover:bg-secondary-hover active:bg-[#1e6f4a]',
    outline:
      'bg-transparent border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary',
    danger:
      'bg-error text-white hover:opacity-90 active:bg-[#e04545]',
    tertiary:
      'bg-light-surface dark:bg-dark-surface text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated hover:border-primary',
    ghost:
      'bg-transparent text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background hover:bg-light-surface dark:hover:bg-dark-surface',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel || (isIconOnly ? 'Action button' : undefined)}
      className={`
        ${baseClasses}
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <FontAwesomeIcon icon={faSpinner} className={`animate-spin ${children ? 'mr-2' : ''}`} />
      ) : icon && iconPosition === 'left' ? (
        <FontAwesomeIcon icon={icon} className={`${children ? 'mr-2' : ''} text-sm`} />
      ) : null}

      {children && <span>{children}</span>}

      {!isLoading && icon && iconPosition === 'right' && children ? (
        <FontAwesomeIcon icon={icon} className="ml-2 text-sm" />
      ) : null}
    </button>
  );
};

export default Button;
