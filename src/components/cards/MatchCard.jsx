import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faClock,
  faUsers,
  faShieldHalved,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrencyBDT } from '../../utils/formatters';

export const MatchCard = ({ match, onJoin, isJoining = false }) => {
  const {
    id,
    title,
    sport,
    venue,
    area,
    timeDisplay,
    totalSlots,
    filledSlots,
    joinMode,
    fee,
    organizer,
    image,
  } = match;

  const slotsLeft = Math.max(0, totalSlots - filledSlots);
  const isFull = slotsLeft === 0;

  return (
    <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden flex flex-col justify-between transition-base hover:border-primary group">
      <div>
        {/* Card Header Media */}
        <div className="relative h-44 w-full bg-light-surface-elevated dark:bg-dark-surface-elevated overflow-hidden">
          <img
            src={image || '/src/assets/images/futsal_night.jpg'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-dark-background/80 backdrop-blur-sm text-primary font-label text-xs font-semibold border border-dark-border">
              {sport}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full bg-dark-background/80 backdrop-blur-sm text-white font-label text-xs font-bold border border-dark-border tabular-nums">
              {formatCurrencyBDT(fee)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label text-xs font-semibold text-secondary flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBolt} className="text-primary text-xs" />
              <span>{joinMode}</span>
            </span>

            <Badge
              variant={isFull ? 'error' : slotsLeft <= 2 ? 'warning' : 'success'}
              size="sm"
              hasDot
            >
              {slotsLeft} slots left
            </Badge>
          </div>

          <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface leading-snug line-clamp-2">
            {title}
          </h3>

          <div className="flex flex-col gap-1.5 text-xs text-light-muted dark:text-dark-muted font-body">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="w-3.5 text-primary shrink-0" />
              <span className="truncate">{venue || area}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="w-3.5 text-primary shrink-0" />
              <span className="tabular-nums">{timeDisplay}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} className="w-3.5 text-primary shrink-0" />
              <span className="tabular-nums">{filledSlots} / {totalSlots} players confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-0 border-t border-light-border/50 dark:border-dark-border/50 flex items-center justify-between gap-3 mt-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
            {organizer?.name ? organizer.name.charAt(0) : 'O'}
          </div>
          <span className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
            {organizer?.name || 'Organizer'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/matches/${id}`}>
            <Button variant="tertiary" size="sm">
              Details
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            disabled={isFull}
            isLoading={isJoining}
            onClick={() => onJoin && onJoin(id)}
          >
            {isFull ? 'Full' : 'Join'}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default MatchCard;
