import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import Button from './Button';

export const EmptyState = ({
  icon = faFutbol,
  title = 'No matches found',
  description = 'There are no active matches matching your current criteria. Try adjusting your filters or publish your own Quick Match.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        rounded-lg border border-light-border dark:border-dark-border
        bg-light-surface dark:bg-dark-surface
        p-8 text-center flex flex-col items-center justify-center gap-4
        ${className}
      `}
    >
      <div className="w-14 h-14 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center text-primary">
        <FontAwesomeIcon icon={icon} className="text-2xl" />
      </div>

      <div className="max-w-md">
        <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface">
          {title}
        </h3>
        <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
