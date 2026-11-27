import React from 'react';

export const Skeleton = ({
  variant = 'card',
  count = 1,
  className = '',
}) => {
  const items = Array.from({ length: count });

  if (variant === 'text') {
    return (
      <div className={`flex flex-col gap-2.5 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-full"
            style={{ width: i === items.length - 1 && count > 1 ? '65%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`flex items-center gap-3 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated shrink-0"
          />
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="animate-pulse p-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-6 w-20 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded" />
              <div className="h-3 w-28 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: Match / Content Card
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden flex flex-col gap-4"
        >
          <div className="h-44 bg-light-surface-elevated dark:bg-dark-surface-elevated w-full" />
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-24" />
              <div className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-16" />
            </div>
            <div className="h-6 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-3/4" />
            <div className="h-4 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded w-1/2" />
            <div className="h-10 bg-light-surface-elevated dark:bg-dark-surface-elevated rounded-md mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
