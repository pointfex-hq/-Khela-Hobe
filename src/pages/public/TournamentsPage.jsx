import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faLocationDot,
  faCalendarCheck,
  faUsers,
  faTicket,
  faHeart,
  faMagnifyingGlass,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const TournamentsPage = () => {
  const { isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [selectedCity, setSelectedCity] = useState('All Bangladesh');
  const [interestLoadingId, setInterestLoadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const sportsCatalog = useAppStore((s) => s.sports);
  const fetchSports = useAppStore((s) => s.fetchSports);
  const zonesCatalog = useAppStore((s) => s.zones);
  const fetchLocations = useAppStore((s) => s.fetchLocations);

  const loadTournaments = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await eventService.getPublicEvents({
        page: targetPage - 1,
        size: 9,
        ...(selectedSport !== 'All Sports' ? { sport: selectedSport } : {}),
        ...(selectedCity !== 'All Bangladesh' ? { city: selectedCity } : {}),
        ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
      });
      setTournaments(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toastService.error('Failed to load tournaments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [selectedSport, selectedCity, searchQuery]);

  useEffect(() => {
    loadTournaments(page);
  }, [page, selectedSport, selectedCity, searchQuery]);

  useEffect(() => {
    fetchSports();
    fetchLocations();
  }, [fetchSports, fetchLocations]);

  const handleToggleInterest = async (tournament) => {
    if (!isAuth) {
      toastService.info('Please sign in to mark interest in a tournament.');
      return;
    }
    setInterestLoadingId(tournament.id);
    try {
      const res = await eventService.toggleInterest(tournament.id);
      if (res?.data) {
        setTournaments((prev) =>
          prev.map((t) =>
            t.id === tournament.id
              ? {
                  ...t,
                  isInterested: res.data.interested,
                  interestCount: res.data.interestCount,
                }
              : t
          )
        );
      }
    } catch (err) {
      toastService.error(err?.message || 'Unable to update interest.');
    } finally {
      setInterestLoadingId(null);
    }
  };

  const cities = useMemo(() => {
    const set = new Set(zonesCatalog.map((z) => z.city).filter(Boolean));
    return ['All Bangladesh', ...Array.from(set)];
  }, [zonesCatalog]);

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      if (
        selectedSport !== 'All Sports' &&
        !String(t.sport).toLowerCase().includes(selectedSport.toLowerCase())
      ) {
        return false;
      }
      if (
        selectedCity !== 'All Bangladesh' &&
        !String(t.city || '').toLowerCase().includes(selectedCity.toLowerCase()) &&
        !String(t.area || '').toLowerCase().includes(selectedCity.toLowerCase())
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title?.toLowerCase().includes(q) ||
          t.venueName?.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q) ||
          t.sport?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tournaments, selectedSport, selectedCity, searchQuery]);

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="font-headline text-headline-lg font-bold tracking-tight flex items-center gap-2.5">
            <FontAwesomeIcon icon={faTrophy} className="text-warning" />
            <span>Tournaments &amp; Leagues Across Bangladesh</span>
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted mt-1">
            Apply with your squad via teammate Safety IDs, show interest, or grab spectator tickets.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2 flex items-center">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3.5 text-light-muted dark:text-dark-muted text-xs"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tournaments by name, venue, sport, city..."
            className="w-full pl-9 pr-4 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
        >
          <option value="All Sports">All Sports</option>
          {sportsCatalog.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
        >
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" message="Loading approved tournaments..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={faTrophy}
          title="No tournaments match your filter"
          description="Check back soon or clear filters to see upcoming tournaments."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => {
            const seatsBadge =
              t.spectatorMode === 'NONE'
                ? 'Players Only'
                : t.spectatorMode === 'LIMITED_TICKETS'
                  ? `Tickets: BDT ${t.ticketPrice} (${t.remainingSeats ?? 0} left)`
                  : 'Open for All Spectators';

            return (
              <article
                key={t.id}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden flex flex-col justify-between shadow-sm hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="relative h-44 bg-light-surface-elevated dark:bg-dark-surface-elevated">
                    {t.image ? (
                      <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏆</div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-dark-background/85 text-primary font-label text-xs font-bold">
                      {t.sport}
                    </span>
                    {Array.isArray(t.bannerImages) && t.bannerImages.length > 1 && (
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-dark-background/80 text-white font-mono text-[10px] font-semibold">
                        1/{t.bannerImages.length} photos
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={interestLoadingId === t.id}
                      onClick={() => handleToggleInterest(t)}
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-label font-semibold flex items-center gap-1.5 backdrop-blur-sm border transition-colors ${
                        t.isInterested
                          ? 'bg-error text-white border-error'
                          : 'bg-dark-background/75 text-white border-white/20 hover:border-primary'
                      }`}
                    >
                      <FontAwesomeIcon icon={faHeart} />
                      <span>{t.interestCount || 0}</span>
                    </button>
                  </div>

                  <div className="p-5 flex flex-col gap-2.5">
                    <h2 className="font-headline text-title-md font-bold line-clamp-1">
                      {t.title}
                    </h2>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faLocationDot} className="text-primary" />
                      <span className="truncate">{t.venue} • {t.city}</span>
                    </p>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faCalendarCheck} className="text-secondary" />
                      <span>{t.date} • {t.time}</span>
                    </p>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faUsers} className="text-primary" />
                      <span>
                        {t.filledTeams ?? 0}/{t.maxTeams} Teams • {t.teamSize} players/squad • {t.fee}
                      </span>
                    </p>

                    {(t.prizePool || t.championPrize) && (
                      <div className="px-2.5 py-1.5 rounded bg-warning/10 border border-warning/30 text-xs font-semibold text-warning truncate">
                        🏆 {t.prizePool || t.championPrize}
                      </div>
                    )}

                    <div className="text-[11px] font-label font-semibold text-secondary">
                      <FontAwesomeIcon icon={faTicket} className="mr-1.5" />
                      <span>{seatsBadge}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center gap-2">
                  <Link
                    to={ROUTES.EVENT_DETAILS.replace(':eventId', t.id)}
                    className="flex-1 py-2 rounded-md bg-primary text-on-primary text-center font-label text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5"
                  >
                    <span>View &amp; Apply</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                  </Link>
                  {t.spectatorMode !== 'NONE' && (
                    <Link
                      to={ROUTES.TICKET_BOOKING.replace(':eventId', t.id)}
                      className="px-3 py-2 rounded-md border border-light-border dark:border-dark-border hover:border-primary font-label text-xs font-semibold"
                    >
                      Tickets
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="pt-2"
        />
      )}
    </div>
  );
};

export default TournamentsPage;
