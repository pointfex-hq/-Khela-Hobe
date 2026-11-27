import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faPlus,
  faMapLocationDot,
  faClock,
  faUsers,
  faCheck,
  faArrowRight,
  faHandshakeAngle,
  faFutbol,
  faTableTennisPaddleBall,
  faBasketball,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { matchService } from '../../services/endpoints/matchService';
import { playerService } from '../../services/endpoints/playerService';
import { useAppStore } from '../../store/useAppStore';
import { haversineDistanceKm } from '../../utils/formatters';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export const PlayerHomePage = () => {
  const { user } = useAuth();

  const [selectedSport, setSelectedSport] = useState('All Sports');
  const rawMatches = useAppStore((s) => s.matches);
  const fetchMatches = useAppStore((s) => s.fetchMatches);
  const loading = useAppStore((s) => s.matchesLoading);
  const userLocation = useAppStore((s) => s.userLocation);
  const detectUserLocation = useAppStore((s) => s.detectUserLocation);
  const [schedule, setSchedule] = useState([]);

  const sportsPills = ['All Sports', 'Football', 'Badminton', 'Cricket', 'Basketball'];

  useEffect(() => {
    fetchMatches();
    detectUserLocation();
    playerService
      .getPlayerUpcomingSchedule(user?.id)
      .then((res) => setSchedule(res.data || []))
      .catch(() => {});
  }, [fetchMatches, detectUserLocation, user?.id]);

  // Filter & prioritize nearest user location in-memory without re-querying DB
  const matches = useMemo(() => {
    let list = (rawMatches || []).filter(
      (m) => m.state !== 'cancelled' && m.status !== 'CANCELLED'
    );
    if (selectedSport && selectedSport !== 'All Sports') {
      const q = selectedSport.toLowerCase();
      list = list.filter(
        (m) => m.sport?.toLowerCase().includes(q) || m.sportCategory?.toLowerCase().includes(q)
      );
    }
    if (userLocation?.lat && userLocation?.lng) {
      list = [...list].sort((a, b) => {
        const dA =
          haversineDistanceKm(userLocation.lat, userLocation.lng, a.coordinates?.lat, a.coordinates?.lng) ??
          9999;
        const dB =
          haversineDistanceKm(userLocation.lat, userLocation.lng, b.coordinates?.lat, b.coordinates?.lng) ??
          9999;
        return dA - dB;
      });
    }
    return list;
  }, [rawMatches, selectedSport, userLocation]);

  const handleJoinMatch = async (match) => {
    try {
      const res = await matchService.joinMatch(match.id, {
        mode: match.mode,
        isApprovalRequired: match.joinMode === 'Approval Required',
      });
      toast.success(res.message || 'Action completed successfully');
    } catch (err) {
      toast.error(err?.message || 'Failed to process match action');
    }
  };

  const getSportIcon = (sport = '') => {
    const s = sport.toLowerCase();
    if (s.includes('badminton')) return faTableTennisPaddleBall;
    if (s.includes('basketball')) return faBasketball;
    return faFutbol;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting & Quick Action Banner (Matches UIUX Reference lines 304-317) */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
            <FontAwesomeIcon icon={faLocationDot} className="text-primary text-sm" />
            <span className="font-label text-label-md">
              {userLocation ? 'Near Your Location' : user?.area || user?.city || 'Dhaka'} • Asia/Dhaka
            </span>
          </div>
          <h1 className="font-headline text-headline-lg font-bold text-light-on-background dark:text-dark-on-background tracking-tight">
            Ready to play, {user?.name?.split(' ')[0] || 'Player'}?
          </h1>
        </div>

        <Link to={ROUTES.CREATE_QUICK_MATCH} className="self-start md:self-auto">
          <Button
            variant="primary"
            size="md"
            icon={faPlus}
            className="font-bold py-2.5 px-5 shadow-sm"
          >
            Create Quick Match
          </Button>
        </Link>
      </section>

      {/* Sport Filter Pills (Reference lines 320-326) */}
      <section aria-label="Filter by sport" className="flex flex-wrap items-center gap-2">
        {sportsPills.map((sport) => {
          const isActive = selectedSport === sport;
          return (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-full font-label text-label-md transition-all duration-state-change ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface hover:border-primary'
              }`}
            >
              {sport}
            </button>
          );
        })}
      </section>

      {/* Matches Happening Today (Reference lines 329-453) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface">
            Matches Happening Today
          </h2>
          <Link
            to={ROUTES.PLAYER_MAP}
            className="font-label text-label-lg font-semibold text-secondary dark:text-primary hover:underline flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faMapLocationDot} className="text-sm" />
            <span>View Map</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {matches.slice(0, 3).map((match) => {
            const slotsLeft = match.totalSlots - match.filledSlots;
            const isFull = slotsLeft <= 0 || match.joinMode === 'Match Full';

            return (
              <article
                key={match.id}
                className="h-full rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col justify-between gap-4 hover:border-primary transition-colors duration-state-change shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                      <FontAwesomeIcon icon={getSportIcon(match.sport)} className="text-xs" />
                      <span>{match.sport}</span>
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full font-label text-label-sm font-bold ${
                        isFull
                          ? 'bg-error text-on-error'
                          : match.joinMode === 'Approval Required'
                          ? 'bg-warning text-on-warning'
                          : 'bg-success text-on-success'
                      }`}
                    >
                      {isFull ? 'Match Full' : match.joinMode}
                    </span>
                  </div>

                  <div>
                    <Link to={`/matches/${match.id}`}>
                      <h3 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary transition-colors">
                        {match.title}
                      </h3>
                    </Link>
                    <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-1">
                      {match.venue}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 text-body-sm text-light-muted dark:text-dark-muted pt-1">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                      <span className="tabular-nums">{match.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} className="text-primary text-xs" />
                      <span className="tabular-nums">
                        {match.filledSlots} / {match.totalSlots} players • {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left` : '0 slots left'} • {match.skillLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <footer className="pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={match.organizer?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                      alt={match.organizer?.name || 'Organizer'}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <span className="font-body text-body-sm text-light-muted dark:text-dark-muted truncate">
                      {match.organizer?.name || 'Organizer'}
                    </span>
                  </div>

                  {isFull ? (
                    <Link to={`/matches/${match.id}`}>
                      <Button variant="tertiary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  ) : match.joinMode === 'Approval Required' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleJoinMatch(match)}
                    >
                      Apply
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoinMatch(match)}
                    >
                      Join Match
                    </Button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      {/* Recommended & Recently Joined (Reference lines 456-500) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Your Upcoming Schedule */}
        <div className="lg:col-span-8 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface">
              Your Upcoming Schedule
            </h2>
            <Link
              to={ROUTES.PLAYER_MATCHES}
              className="font-label text-xs font-semibold text-secondary dark:text-primary hover:underline"
            >
              View All Matches
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
            {schedule.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={getSportIcon(item.sport)} className="text-base" />
                  </span>
                  <div>
                    <Link to={`/matches/${item.id}`}>
                      <p className="font-title text-title-md font-bold text-light-on-surface dark:text-dark-on-surface hover:text-primary transition-colors">
                        {item.title}
                      </p>
                    </Link>
                    <p className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                      {item.schedule} • {item.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-label text-label-sm font-bold shrink-0 ${
                    item.status === 'Joined'
                      ? 'bg-success text-on-success'
                      : 'bg-warning text-on-warning'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Pledge Card */}
        <div className="lg:col-span-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="font-label text-label-sm uppercase font-bold text-secondary dark:text-primary tracking-wider">
              Equipment Pledge
            </span>
            <h2 className="font-headline text-title-lg font-bold text-light-on-surface dark:text-dark-on-surface">
              Help Complete Local Matches
            </h2>
            <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
              2 matches near Gazipur still need shuttlecocks or match bibs. Pledge gear when you join and earn athlete reputation points.
            </p>
          </div>

          <Link to={ROUTES.EXPLORE_MATCHES} className="w-full">
            <Button
              variant="tertiary"
              size="md"
              fullWidth
              icon={faHandshakeAngle}
              className="border-light-border dark:border-dark-border"
            >
              Browse Gear Needs
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PlayerHomePage;
