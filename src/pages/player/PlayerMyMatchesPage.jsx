import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faClock,
  faLocationDot,
  faUsers,
  faTicket,
  faArrowRight,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export const PlayerMyMatchesPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming Matches (2)' },
    { id: 'joined', label: 'Confirmed Passes (1)' },
    { id: 'past', label: 'Match History (19)' },
  ];

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await matchService.getMatches();
        setMatches(res.data || []);
      } catch (err) {
        console.error('Failed to load my matches', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleWithdraw = async (matchId) => {
    try {
      const res = await matchService.leaveMatch(matchId);
      toast.success(res.message || 'Slot cancelled');
      const refreshed = await matchService.getMatches();
      setMatches(refreshed.data || []);
    } catch {
      toast.error('Failed to release slot');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-headline-lg font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            My Matches
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted mt-1">
            Review your confirmed pitch reservations, squad rosters, and participation archive.
          </p>
        </div>

        <Link to={ROUTES.EXPLORE_MATCHES}>
          <Button variant="primary" size="md" icon={faArrowRight} iconPosition="right">
            Find New Match
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-label text-sm font-semibold transition-colors relative ${
                isActive
                  ? 'text-primary'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          );
        })}
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {matches.slice(0, activeTab === 'past' ? 4 : 2).map((match, idx) => (
          <article
            key={match.id + idx}
            className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col justify-between gap-5 shadow-sm hover:border-primary transition-colors"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                  {match.sport}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm font-bold flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                  <span>{activeTab === 'past' ? 'Completed' : 'Confirmed Slot'}</span>
                </span>
              </div>

              <div>
                <Link to={`/matches/${match.id}`}>
                  <h3 className="font-headline text-xl font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary transition-colors">
                    {match.title}
                  </h3>
                </Link>
                <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
                  {match.venue} • {match.area}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-light-border dark:border-dark-border text-xs text-light-muted dark:text-dark-muted">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-primary" />
                  <span className="tabular-nums font-medium text-light-on-surface dark:text-dark-on-surface">
                    {match.schedule}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-primary" />
                  <span className="tabular-nums">
                    {match.filledSlots} / {match.totalSlots} players confirmed • {match.skillLevel}
                  </span>
                </div>
              </div>
            </div>

            <footer className="pt-3 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link to={ROUTES.PLAYER_TICKETS}>
                  <Button variant="secondary" size="sm" icon={faTicket}>
                    Gate Pass
                  </Button>
                </Link>
                <Link to={`/matches/${match.id}`}>
                  <Button variant="tertiary" size="sm">
                    Details
                  </Button>
                </Link>
              </div>

              {activeTab !== 'past' && (
                <button
                  type="button"
                  onClick={() => handleWithdraw(match.id)}
                  className="font-label text-xs text-error hover:underline"
                >
                  Withdraw
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
};

export default PlayerMyMatchesPage;
