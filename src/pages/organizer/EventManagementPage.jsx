import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faPlus,
  faCreditCard,
  faLocationDot,
  faCalendarCheck,
  faUsers,
  faQrcode,
  faEye,
  faPenToSquare,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { ROUTES } from '../../constants/routes';

export const EventManagementPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await eventService.getOrganizerEvents(filter, {
          page: page - 1,
          size: 8,
        });
        if (res?.data) {
          setEvents(res.data);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filter, page]);

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
      {/* Contextual Header (Reference: UIUX/event_management/code.html lines 212-221) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-headline-lg font-bold tracking-tight">
            Event Management
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted mt-1">
            Manage ticketed tournaments, venue check-ins, and event capacity.
          </p>
        </div>

        <Link
          to={ROUTES.ORGANIZER_EVENT_CREATE}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} className="text-sm" />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Admin Moderation Notice Banner */}
      <div className="rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-primary/40 p-4 flex items-center gap-3.5">
        <FontAwesomeIcon icon={faTrophy} className="text-primary text-xl shrink-0" />
        <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
          <strong className="text-light-on-surface dark:text-dark-on-surface font-semibold">
            Tournament Moderation &amp; Prizes:
          </strong>{' '}
          Submitted tournaments go through Admin moderation before public listing. Include champion/MVP prizes, rules, and venue coordinates for fast approval.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Tournaments' },
          { key: 'APPROVED', label: 'Approved / Open' },
          { key: 'PENDING_APPROVAL', label: 'Pending Admin' },
          { key: 'REJECTED', label: 'Needs Changes' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-md font-label text-label-md transition-colors ${
              filter === tab.key
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" message="Loading tournament fixtures..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={faTrophy}
          title="No tournaments found"
          description="You haven't created any tournaments in this category yet."
          actionLabel="Create First Tournament"
          onAction={() => navigate(ROUTES.ORGANIZER_EVENT_CREATE)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((evt) => {
            const statusUpper = String(evt.status || '').toUpperCase();
            const isOpen = statusUpper === 'APPROVED' || statusUpper.includes('OPEN');
            const isRejected = statusUpper === 'REJECTED';
            const registeredCount = evt.filledTeams ?? evt.registeredTeams ?? 0;
            return (
              <article
                key={evt.id}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors hover:border-primary/50 shadow-sm"
              >
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-label text-label-sm font-semibold ${
                        isOpen
                          ? 'bg-success text-on-success'
                          : isRejected
                            ? 'bg-error/15 text-error'
                            : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {evt.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-label text-xs font-semibold">
                      {evt.sport}
                    </span>
                    {(evt.prizePool || evt.championPrize) && (
                      <span className="px-2 py-0.5 rounded bg-warning/15 text-warning font-label text-xs font-semibold">
                        🏆 {evt.prizePool || evt.championPrize}
                      </span>
                    )}
                  </div>

                  <h2 className="font-headline text-title-lg font-bold truncate">
                    {evt.title}
                  </h2>

                  <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
                    {evt.venue} ({evt.city}) • {evt.date}, {evt.time} •{' '}
                    <span className="tabular-nums font-medium text-light-on-surface dark:text-dark-on-surface">
                      {registeredCount} / {evt.totalTeams} teams registered
                    </span>
                  </p>
                  {isRejected && evt.moderationNote && (
                    <p className="font-body text-xs text-error">
                      Admin Note: {evt.moderationNote}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    to={ROUTES.ORGANIZER_EVENT_PARTICIPANTS.replace(':eventId', evt.id)}
                    className="shrink-0 px-3.5 py-2 rounded-md bg-secondary/15 border border-secondary/30 text-secondary font-label text-label-md font-semibold hover:bg-secondary/20 transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faUsers} className="text-xs" />
                    <span>Squads ({registeredCount})</span>
                  </Link>

                  <Link
                    to={ROUTES.EVENT_DETAILS.replace(':eventId', evt.id)}
                    className="shrink-0 px-4 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-xs text-light-muted dark:text-dark-muted" />
                    <span>View</span>
                  </Link>

                  <Link
                    to={`${ROUTES.ORGANIZER_CHECK_IN}?eventId=${evt.id}`}
                    className="shrink-0 px-4 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faQrcode} className="text-xs" />
                    <span>Tickets &amp; Coupons</span>
                  </Link>

                  <Link
                    to={ROUTES.ORGANIZER_EVENT_EDIT.replace(':eventId', evt.id)}
                    className="shrink-0 px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="text-xs text-light-muted dark:text-dark-muted" />
                    <span>Edit</span>
                  </Link>
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

export default EventManagementPage;
