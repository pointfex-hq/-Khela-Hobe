import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faStar, faShieldHalved, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const PlayerCard = ({
  player,
  onInvite,
  onViewProfile,
  className = '',
}) => {
  const {
    id,
    name = 'Player Name',
    area = 'Dhaka',
    city = 'Dhaka',
    skillLevel = 'Intermediate',
    matchesPlayed = 24,
    reputation = 98,
    preferredSports = ['Football', 'Badminton'],
    avatar,
  } = player || {};

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
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center justify-center font-bold text-primary text-lg">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.charAt(0)
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-light-surface dark:border-dark-surface" />
          </div>

          <div className="flex flex-col min-w-0">
            <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface truncate">
              {name}
            </h3>
            <span className="font-body text-xs text-light-muted dark:text-dark-muted flex items-center gap-1 mt-0.5">
              <FontAwesomeIcon icon={faLocationDot} className="text-primary text-[10px]" />
              <span className="truncate">{area}, {city}</span>
            </span>
          </div>
        </div>

        <Badge variant="primary" size="sm">
          {skillLevel}
        </Badge>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-center">
        <div>
          <span className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface tabular-nums">
            {matchesPlayed}
          </span>
          <p className="font-label text-[11px] text-light-muted dark:text-dark-muted uppercase tracking-wider">
            Matches
          </p>
        </div>
        <div>
          <span className="font-headline text-base font-bold text-primary tabular-nums">
            {reputation}%
          </span>
          <p className="font-label text-[11px] text-light-muted dark:text-dark-muted uppercase tracking-wider">
            Attendance
          </p>
        </div>
      </div>

      {/* Sports Tags */}
      <div className="flex flex-wrap gap-1.5">
        {preferredSports.map((sport, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded font-label text-[11px] font-semibold bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted border border-light-border/60 dark:border-dark-border/60"
          >
            {sport}
          </span>
        ))}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-light-border dark:border-dark-border flex items-center gap-2">
        <Button
          variant="tertiary"
          size="sm"
          fullWidth
          onClick={() => onViewProfile && onViewProfile(id)}
        >
          Profile
        </Button>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => onInvite && onInvite(id)}
        >
          Invite
        </Button>
      </div>
    </article>
  );
};

export default PlayerCard;
