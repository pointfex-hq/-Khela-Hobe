import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrophy,
  faUsers,
  faTicket,
  faCheck,
  faXmark,
  faRankingStar,
  faEye,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/endpoints/eventService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const AdminTournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [noteById, setNoteById] = useState({});
  const [busyId, setBusyId] = useState(null);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const res = await eventService.getAdminTournaments(statusFilter);
      setTournaments(res.data || []);
    } catch {
      toastService.error('Failed to load admin tournament oversight.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, [statusFilter]);

  const handleModerate = async (id, action) => {
    setBusyId(id);
    try {
      const res = await eventService.moderateTournament(id, action, noteById[id] || '');
      toastService.success(res.message);
      await loadTournaments();
    } catch (err) {
      toastService.error(err?.message || 'Moderation failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <FontAwesomeIcon icon={faTrophy} className="text-warning" />
            <span>Admin Tournament Master Console</span>
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Full oversight across all tournaments: approve submissions, inspect squad participants, track ticket revenue, and edit leaderboards &amp; results.
          </p>
        </div>

        <Link
          to={ROUTES.ORGANIZER_EVENT_CREATE}
          className="self-start sm:self-auto px-4 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90"
        >
          + Create Tournament
        </Link>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'REJECTED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-md font-label text-xs font-semibold transition-colors ${
              statusFilter === st
                ? 'bg-primary text-on-primary'
                : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" message="Loading tournament records..." />
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={faTrophy}
          title="No tournaments in this status"
          description="Submitted and approved tournaments will appear here with participant and ticket analytics."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tournaments.map((t) => {
            const isExpanded = expandedId === t.id;
            return (
              <article
                key={t.id}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-label font-semibold ${
                          t.status === 'APPROVED' || t.status === 'COMPLETED'
                            ? 'bg-success text-on-success'
                            : t.status === 'REJECTED'
                              ? 'bg-error/15 text-error'
                              : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-label text-xs font-semibold">
                        {t.sport}
                      </span>
                      <span className="text-xs text-light-muted dark:text-dark-muted">
                        Host: <strong>{t.organizer?.name || 'Organizer'}</strong>
                      </span>
                    </div>
                    <h2 className="font-headline text-lg sm:text-xl font-bold mt-1 truncate">
                      {t.title}
                    </h2>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      {t.venueName} ({t.area || t.city}) • {t.startDate} • {t.time}
                    </p>
                  </div>

                  {/* Quick Summary Metrics */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs shrink-0">
                    <div className="p-2.5 rounded bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                      <span className="block text-[10px] text-light-muted dark:text-dark-muted">Squads</span>
                      <strong className="font-mono text-sm">
                        {t.filledTeams}/{t.maxTeams}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                      <span className="block text-[10px] text-light-muted dark:text-dark-muted">Tickets</span>
                      <strong className="font-mono text-sm text-primary">
                        {t.ticketsSold ?? 0} ({t.checkedInTickets ?? 0} in)
                      </strong>
                    </div>
                    <div className="p-2.5 rounded bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
                      <span className="block text-[10px] text-light-muted dark:text-dark-muted">Revenue</span>
                      <strong className="font-mono text-sm text-success">
                        BDT {t.ticketRevenue ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                  <Link
                    to={`/admin/events/${t.id}/participants`}
                    className="px-3.5 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faRankingStar} />
                    <span>Manage Squads, Results &amp; Leaderboard</span>
                  </Link>
                  <Link
                    to={`/organizer/events/${t.id}/check-in`}
                    className="px-3.5 py-2 rounded-md border border-secondary text-secondary font-label text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faTicket} />
                    <span>Ticket Check-In &amp; Coupons</span>
                  </Link>
                  <Link
                    to={`/events/${t.id}`}
                    className="px-3.5 py-2 rounded-md border border-light-border dark:border-dark-border font-label text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    <span>Public View</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    className="px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated font-label text-xs font-semibold ml-auto"
                  >
                    {isExpanded ? 'Hide Details' : 'Inspect Tickets & Squads'}
                  </button>
                </div>

                {t.status === 'PENDING_APPROVAL' && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={noteById[t.id] || ''}
                      onChange={(e) => setNoteById((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Moderation note (optional)..."
                      className="flex-1 px-3 py-1.5 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === t.id}
                        onClick={() => handleModerate(t.id, 'APPROVE')}
                        className="px-3.5 py-1.5 rounded bg-success text-on-success font-label text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === t.id}
                        onClick={() => handleModerate(t.id, 'REJECT')}
                        className="px-3.5 py-1.5 rounded border border-error text-error font-label text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-light-border dark:border-dark-border text-xs">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-headline font-bold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUsers} className="text-secondary" />
                        <span>Registered Squads ({t.recentRegistrations?.length || 0})</span>
                      </h3>
                      {(!t.recentRegistrations || t.recentRegistrations.length === 0) ? (
                        <p className="text-light-muted dark:text-dark-muted">No squads registered yet.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                          {t.recentRegistrations.map((r) => (
                            <div key={r.id} className="p-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex items-center justify-between">
                              <div>
                                <strong>{r.teamName}</strong>
                                <span className="block text-[11px] text-light-muted dark:text-dark-muted">
                                  Capt: {r.captainName} ({r.phone})
                                </span>
                              </div>
                              <span className="font-mono text-[11px] font-bold">{r.status} • {r.paymentStatus}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <h3 className="font-headline font-bold flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary" />
                        <span>Recent Ticket Sales ({t.recentTickets?.length || 0})</span>
                      </h3>
                      {(!t.recentTickets || t.recentTickets.length === 0) ? (
                        <p className="text-light-muted dark:text-dark-muted">No tickets issued or purchased yet.</p>
                      ) : (
                        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                          {t.recentTickets.map((tk) => (
                            <div key={tk.id} className="p-2 rounded bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-primary mr-1.5">{tk.ticketCode}</span>
                                <span>{tk.attendeeName}</span>
                              </div>
                              <span className="font-mono text-[11px]">
                                BDT {tk.finalPrice} • {tk.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTournamentsPage;
