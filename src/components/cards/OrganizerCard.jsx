import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faShieldHalved,
  faCalendarCheck,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const OrganizerCard = ({
  organizer,
  onContact,
  onViewMatches,
  className = '',
}) => {
  const {
    id,
    name = 'Organizer Name',
    organization = 'Sports Collective',
    city = 'Dhaka',
    area = 'Uttara',
    matchesOrganized = 48,
    rating = 4.9,
    verified = true,
    avatar,
  } = organizer || {};

  return (
    <article
      className={`
        rounded-lg bg-light-surface dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        p-5 flex flex-col justify-between gap-4 transition-state hover:border-primary
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center font-bold text-primary text-lg overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0)
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface truncate">
                {name}
              </h3>
              {verified && (
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className="text-secondary text-xs"
                  title="Verified Match Organizer"
                />
              )}
            </div>
            <p className="font-body text-xs text-secondary font-semibold truncate">
              {organization}
            </p>
            <span className="font-body text-[11px] text-light-muted dark:text-dark-muted flex items-center gap-1 mt-0.5">
              <FontAwesomeIcon icon={faLocationDot} className="text-primary text-[10px]" />
              <span>{area}, {city}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded bg-warning/15 text-warning font-label text-xs font-bold tabular-nums">
          <FontAwesomeIcon icon={faStar} className="text-[11px]" />
          <span>{rating}</span>
        </div>
      </div>

      <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-body text-light-muted dark:text-dark-muted">
          <FontAwesomeIcon icon={faCalendarCheck} className="text-primary text-xs" />
          <span>Matches Organized</span>
        </div>
        <span className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface tabular-nums">
          {matchesOrganized}
        </span>
      </div>

      <div className="pt-3 border-t border-light-border dark:border-dark-border flex items-center gap-2">
        <Button
          variant="tertiary"
          size="sm"
          fullWidth
          onClick={() => onViewMatches && onViewMatches(id)}
        >
          View Games
        </Button>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => onContact && onContact(id)}
        >
          Contact
        </Button>
      </div>
    </article>
  );
};

export default OrganizerCard;
