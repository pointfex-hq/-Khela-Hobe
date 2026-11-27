import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const StatCard = ({ icon, value, label, subtext, className = '' }) => {
  return (
    <div
      className={`
        rounded-lg bg-light-surface dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        p-5 flex items-center gap-4 transition-base
        hover:border-primary ${className}
      `}
    >
      {icon && (
        <span className="w-12 h-12 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center shrink-0 border border-light-border dark:border-dark-border">
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </span>
      )}

      <div className="flex flex-col">
        <span className="font-headline text-2xl font-bold text-light-on-background dark:text-dark-on-background tabular-nums tracking-tight">
          {value}
        </span>
        <span className="font-label text-xs font-semibold text-secondary uppercase tracking-wider">
          {label}
        </span>
        {subtext && (
          <span className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
