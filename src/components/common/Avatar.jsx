import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export const Avatar = ({
  src,
  alt = 'User avatar',
  name = '',
  size = 'md',
  status, // 'online' | 'offline' | 'busy'
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 border-[1px]',
    sm: 'w-2 h-2 border-[1.5px]',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  };

  const statusColors = {
    online: 'bg-success',
    busy: 'bg-error',
    offline: 'bg-light-muted dark:bg-dark-muted',
  };

  const getInitials = (text) => {
    if (!text) return '';
    const parts = text.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`
          rounded-full overflow-hidden bg-light-surface-elevated dark:bg-dark-surface-elevated
          border border-light-border dark:border-dark-border
          flex items-center justify-center font-headline font-bold text-primary select-none
          ${sizeClasses[size] || sizeClasses.md}
        `}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <FontAwesomeIcon icon={faUser} className="text-light-muted dark:text-dark-muted text-xs" />
        )}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full
            border-light-surface dark:border-dark-surface
            ${statusDotSizes[size] || statusDotSizes.md}
            ${statusColors[status] || statusColors.online}
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
