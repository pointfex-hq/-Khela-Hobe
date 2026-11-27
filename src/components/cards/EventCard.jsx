import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faCalendarDays,
  faLocationDot,
  faUsers,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrencyBDT } from '../../utils/formatters';

export const EventCard = ({
  event,
  onRegister,
  className = '',
}) => {
  const {
    id,
    title = 'Dhaka Premier Futsal Championship',
    sport = 'Football & Futsal',
    date = 'Dec 12 - Dec 14, 2026',
    venue = 'Banani Club Arena Turf',
    city = 'Dhaka',
    entryFee = 3500,
    prizePool = '৳50,000',
    teamsRegistered = 12,
    maxTeams = 16,
    status = 'REGISTRATION_OPEN',
    image = '/src/assets/images/futsal_night.jpg',
  } = event || {};

  const isRegistrationOpen = status === 'REGISTRATION_OPEN';

  return (
    <article
      className={`
        rounded-lg bg-light-surface dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        overflow-hidden flex flex-col justify-between transition-state hover:border-primary group
        ${className}
      `}
    >
      <div className="relative h-44 w-full bg-light-surface-elevated dark:bg-dark-surface-elevated overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="primary" size="sm">
            {sport}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge
            variant={isRegistrationOpen ? 'success' : 'neutral'}
            size="sm"
            hasDot
          >
            {isRegistrationOpen ? 'Registration Open' : 'Closed'}
          </Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-label text-primary font-bold">
          <FontAwesomeIcon icon={faTrophy} className="text-xs" />
          <span>Prize Pool: {prizePool}</span>
        </div>

        <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface leading-snug">
          {title}
        </h3>

        <div className="flex flex-col gap-1.5 text-xs text-light-muted dark:text-dark-muted font-body">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 text-primary shrink-0" />
            <span className="tabular-nums">{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faLocationDot} className="w-3.5 text-primary shrink-0" />
            <span className="truncate">{venue}, {city}</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="w-3.5 text-primary shrink-0" />
            <span className="tabular-nums">{teamsRegistered} / {maxTeams} Teams Enrolled</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0 border-t border-light-border/60 dark:border-dark-border/60 flex items-center justify-between gap-3 mt-2">
        <div className="flex flex-col">
          <span className="font-label text-[11px] text-light-muted dark:text-dark-muted">Entry Fee</span>
          <span className="font-headline text-sm font-bold text-light-on-surface dark:text-dark-on-surface tabular-nums">
            {formatCurrencyBDT(entryFee)}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={!isRegistrationOpen}
          onClick={() => onRegister && onRegister(id)}
        >
          {isRegistrationOpen ? 'Register Team' : 'Completed'}
        </Button>
      </div>
    </article>
  );
};

export default EventCard;
