import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faStar,
  faTicket,
  faArrowRight,
  faClock,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/cards/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { matchService } from '../../services/endpoints/matchService';
import { playerService } from '../../services/endpoints/playerService';
import { ROUTES } from '../../constants/routes';

export const PlayerDashboardPage = () => {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats, setStats] = useState({ matchesPlayed: 0, reputation: 100 });

  useEffect(() => {
    let active = true;
    Promise.all([
      matchService.getMatches({ size: 2 }).catch(() => ({ data: [] })),
      playerService.getPlayerStats(user?.id).catch(() => ({ data: {} })),
    ]).then(([matchRes, statsRes]) => {
      if (!active) return;
      setUpcomingMatches((matchRes.data || []).slice(0, 2));
      if (statsRes?.data) {
        setStats((prev) => ({ ...prev, ...statsRes.data }));
      }
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="p-4 sm:p-8 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
        <div>
          <Badge variant="primary" size="sm" className="mb-2">
            Player Workspace
          </Badge>
          <h1 className="heading-4 sm:heading-3 font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
            Welcome back, {user?.name || user?.fullName || 'Player'}
          </h1>
          <p className="body-4 text-light-muted dark:text-dark-muted mt-1">
            {user?.area || user?.city || 'Bangladesh'} • Skill: {user?.skillLevel || 'Intermediate'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={ROUTES.EXPLORE_MATCHES}>
            <Button variant="primary" size="md" icon={faArrowRight} iconPosition="right">
              Find New Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={faFutbol}
          value={stats.matchesPlayed || 0}
          label="Matches Played"
          subtext="Tracked on your account"
        />
        <StatCard
          icon={faStar}
          value={`${stats.showUpRate ?? 100}%`}
          label="Attendance Score"
          subtext="Reliable teammate rating"
        />
        <StatCard
          icon={faTicket}
          value={upcomingMatches.length}
          label="Open Matches"
          subtext="Available to join"
        />
      </div>

      {/* Upcoming Reserved Games */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="title-1 font-headline font-bold text-light-on-background dark:text-dark-on-background">
            Upcoming Matches
          </h2>
          <Link to={ROUTES.EXPLORE_MATCHES} className="font-label text-xs text-primary hover:underline">
            Browse all
          </Link>
        </div>

        {upcomingMatches.length === 0 ? (
          <div className="p-8 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-center text-sm text-light-muted dark:text-dark-muted">
            No upcoming matches found yet. Explore matches to join a game.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="success" size="sm" hasDot>
                    {m.joinMode || 'Open'}
                  </Badge>
                  <span className="font-label text-xs font-semibold text-primary">
                    {m.sport}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface">
                    {m.title}
                  </h3>
                  <div className="flex flex-col gap-1 text-xs text-light-muted dark:text-dark-muted font-body mt-2">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faLocationDot} className="text-primary text-xs" />
                      <span>{m.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                      <span className="tabular-nums">{m.timeDisplay || m.schedule}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-light-border/60 dark:border-dark-border/60 flex items-center justify-between">
                  <span className="font-body text-xs text-light-muted dark:text-dark-muted">
                    Organizer: {m.organizer?.name || 'Organizer'}
                  </span>
                  <Link to={`/matches/${m.id}`}>
                    <Button variant="tertiary" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboardPage;
