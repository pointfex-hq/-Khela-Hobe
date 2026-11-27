import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faTableTennisPaddleBall,
  faBaseballBatBall,
  faBasketball,
} from '@fortawesome/free-solid-svg-icons';

const ICON_MAP = {
  faFutbol,
  faTableTennisPaddleBall,
  faBaseballBatBall,
  faBasketball,
};

export const SportCard = ({ sport, isSelected = false, onSelect }) => {
  const { id, name, formats, matchCount, icon, description } = sport;
  const iconComponent = ICON_MAP[icon] || faFutbol;

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(id)}
      className={`
        text-left h-full rounded-lg p-5 flex flex-col justify-between gap-4 transition-base
        border select-none
        ${
          isSelected
            ? 'bg-light-surface-elevated dark:bg-dark-surface-elevated border-primary ring-1 ring-primary'
            : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border hover:border-primary'
        }
      `}
    >
      <div className="flex items-center justify-between w-full">
        <span className="w-12 h-12 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center border border-light-border dark:border-dark-border">
          <FontAwesomeIcon icon={iconComponent} className="text-xl" />
        </span>
        <span className="font-label text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary tabular-nums">
          {matchCount} matches
        </span>
      </div>

      <div className="w-full">
        <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface">
          {name}
        </h3>
        <p className="font-label text-xs text-secondary font-semibold mt-0.5">
          {formats}
        </p>
        <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-2 line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};

export default SportCard;
