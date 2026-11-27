import React from 'react';

export const LoadingSkeleton = ({ variant = 'card', count = 1, className = '' }) => {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-4"
          >
            <div className="h-40 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded-md w-full" />
            <div className="flex items-center justify-between">
              <div className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-1/3" />
              <div className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-1/4" />
            </div>
            <div className="h-6 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-3/4" />
            <div className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-1/2" />
            <div className="h-10 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded-md mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`animate-pulse flex flex-col gap-3 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="h-12 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded-md w-full"
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
