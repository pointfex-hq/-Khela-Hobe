import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';

export const StatisticCard = ({
  icon,
  value,
  label,
  subtext,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`
        rounded-lg bg-light-surface dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        p-5 flex items-center justify-between gap-4 transition-state
        hover:border-primary ${className}
      `}
    >
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <span className="w-12 h-12 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center shrink-0 border border-light-border dark:border-dark-border">
            <FontAwesomeIcon icon={icon} className="text-xl" />
          </span>
        )}

        <div className="flex flex-col min-w-0">
          <span className="font-headline text-2xl font-bold text-light-on-background dark:text-dark-on-background tabular-nums tracking-tight truncate">
            {value}
          </span>
          <span className="font-label text-xs font-semibold text-secondary uppercase tracking-wider truncate">
            {label}
          </span>
          {subtext && (
            <span className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5 truncate">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {trend && (
        <span className="inline-flex items-center gap-1 font-label text-xs font-bold text-success bg-success/15 px-2 py-1 rounded-full tabular-nums shrink-0">
          <FontAwesomeIcon icon={faArrowTrendUp} className="text-[10px]" />
          <span>{trend}</span>
        </span>
      )}
    </div>
  );
};

export default StatisticCard;
