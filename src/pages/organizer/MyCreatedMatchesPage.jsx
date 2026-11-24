import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMagnifyingGlass,
  faCalendarCheck,
  faLocationDot,
  faClock,
  faUsers,
  faPenToSquare,
  faBan,
  faEye,
  faSliders,
  faUserGroup,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const MyCreatedMatchesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    open: 0,
    full: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  // Cancellation state
  const [cancelTargetMatch, setCancelTargetMatch] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch matches
  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await matchService.getMyCreatedMatches(activeTab);
      if (res?.data) {
        setMatches(res.data);
      }
      if (res?.counts) {
        setCounts(res.counts);
      }
    } catch {
      toastService.error('Failed to load created matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [activeTab]);

  // Filter by search query
  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.sport?.toLowerCase().includes(q) ||
        m.venue?.toLowerCase().includes(q) ||
        m.area?.toLowerCase().includes(q)
    );
  }, [matches, searchQuery]);

  // Handle Cancel match
  const handleConfirmCancel = async () => {
    if (!cancelTargetMatch) return;
    setIsCancelling(true);
    try {
      const res = await matchService.cancelMatch(cancelTargetMatch.id);
      if (res?.success) {
        toastService.success('Match cancelled. All registered players have been notified.');
        setCancelTargetMatch(null);
        await loadMatches();
      } else {
        toastService.error(res?.message || 'Could not cancel match.');
      }
    } catch {
      toastService.error('Failed to cancel match.');
    } finally {
      setIsCancelling(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'open', label: 'Open', count: counts.open },
    { key: 'full', label: 'Full', count: counts.full },
    { key: 'in-progress', label: 'In Progress', count: counts.inProgress },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled / Expired', count: counts.cancelled },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Contextual Header (Parity with UIUX/my_created_matches/code.html lines 230-245) */}
      <header className="sticky top-0 z-20 min-h-16 py-2 border-b border-light-border dark:border-dark-border bg-light-background/95 dark:bg-dark-background/95 backdrop-blur-md px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-title-lg font-bold">Created Matches</h1>
          <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
            Manage your hosted games, squads, capacity, and live status
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={ROUTES.CREATE_QUICK_MATCH}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span>Create Quick Match</span>
          </Link>
        </div>
      </header>

      {/* Filter Tabs & Search Bar (Lines 248-265) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* State Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-3.5 py-2 rounded-md font-label text-label-md tabular-nums transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-primary'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="ml-1.5 opacity-80 text-xs">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted text-sm pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or venue..."
            className="w-full pl-9 pr-4 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" message="Loading your matches..." />
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={faCalendarCheck}
          title="No matches found"
          description={
            searchQuery
              ? `No matches matching "${searchQuery}" in this view.`
              : 'You have not hosted any matches in this category yet.'
          }
          actionLabel="Create a Quick Match"
          onAction={() => navigate(ROUTES.CREATE_QUICK_MATCH)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredMatches.map((match) => {
            const state = match.state || (match.filledSlots >= match.totalSlots ? 'full' : 'open');
            const isCancelled = state === 'cancelled' || match.status === 'CANCELLED';
            const isFull = state === 'full';
            const isInProgress = state === 'in-progress';
            const isCompleted = state === 'completed';
            const isOpen = state === 'open' && !isCancelled;
            const remaining = Math.max(0, match.totalSlots - match.filledSlots);
            const isApprovalRequired = match.joinMode === 'approval';

            return (
              <article
                key={match.id}
                className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:border-primary/50"
              >
                {/* Left: Info & Badges */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Badge */}
                    {isOpen && (
                      <span className="px-2.5 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm shrink-0">
                        Open
                      </span>
                    )}
                    {isFull && (
                      <span className="px-2.5 py-0.5 rounded-full bg-accent text-on-accent font-label text-label-sm shrink-0">
                        Full
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-label text-label-sm shrink-0 font-semibold">
                        In Progress
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-success font-label text-label-sm shrink-0">
                        Completed
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-error text-on-error font-label text-label-sm shrink-0">
                        Cancelled
                      </span>
                    )}

                    {/* Join Mode Badge */}
                    {isOpen && isApprovalRequired && (
                      <span className="px-2.5 py-0.5 rounded-md bg-warning text-on-warning font-label text-label-sm shrink-0 font-semibold">
                        Approval Required (4 pending)
                      </span>
                    )}

                    {/* Slots Info */}
                    {!isCancelled && !isCompleted && (
                      <span className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                        {match.filledSlots} / {match.totalSlots} players •{' '}
                        {isFull ? 'Roster locked' : `${remaining} slot${remaining === 1 ? '' : 's'} left`}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                        {match.filledSlots} / {match.totalSlots} attended
                      </span>
                    )}
                    {isCancelled && (
                      <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                        Session cancelled • Confirmed participants notified
                      </span>
                    )}
                  </div>

                  <h2 className="font-headline text-title-lg font-bold truncate">
                    {match.title}
                  </h2>

                  <p className="font-body text-body-md text-light-muted dark:text-dark-muted flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faLocationDot} className="text-xs text-secondary" />
                      <span>{match.venue || match.area}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faClock} className="text-xs text-primary" />
                      <span>
                        {match.date}, {match.time}
                      </span>
                    </span>
                  </p>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* View public page */}
                  <Link
                    to={ROUTES.MATCH_DETAILS.replace(':matchId', match.id)}
                    className="shrink-0 px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-xs text-light-muted dark:text-dark-muted" />
                    <span>View</span>
                  </Link>

                  {/* Review applications if approval required */}
                  {isOpen && isApprovalRequired && (
                    <Link
                      to={ROUTES.ORGANIZER_MATCH_APPLICATIONS.replace(':matchId', match.id)}
                      className="shrink-0 px-3.5 py-2 rounded-md bg-secondary text-on-secondary font-label text-label-md hover:opacity-90 transition-opacity flex items-center gap-1.5 font-semibold"
                    >
                      <FontAwesomeIcon icon={faClipboardList} className="text-xs" />
                      <span>Review</span>
                    </Link>
                  )}

                  {/* Manage Match Hub (available unless cancelled/completed) */}
                  {!isCancelled && !isCompleted && (
                    <Link
                      to={ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', match.id)}
                      className="shrink-0 px-3.5 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faSliders} className="text-xs" />
                      <span>Manage</span>
                    </Link>
                  )}

                  {/* Participant roster for full/in-progress */}
                  {(isFull || isInProgress) && (
                    <Link
                      to={ROUTES.ORGANIZER_PARTICIPANTS.replace(':matchId', match.id)}
                      className="shrink-0 px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faUserGroup} className="text-xs text-light-muted dark:text-dark-muted" />
                      <span>{isInProgress ? 'Check-In Roster' : 'Participants'}</span>
                    </Link>
                  )}

                  {/* Edit Match */}
                  {!isCancelled && !isCompleted && !isInProgress && (
                    <Link
                      to={ROUTES.ORGANIZER_MATCH_EDIT.replace(':matchId', match.id)}
                      className="shrink-0 px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-xs text-light-muted dark:text-dark-muted" />
                      <span>Edit</span>
                    </Link>
                  )}

                  {/* Cancel Button with Confirmation Dialog */}
                  {!isCancelled && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => setCancelTargetMatch(match)}
                      className="shrink-0 px-3.5 py-2 rounded-md border border-error text-error font-label text-label-md hover:bg-error hover:text-on-error transition-colors flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faBan} className="text-xs" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Destructive Cancel Action */}
      <ConfirmationDialog
        isOpen={Boolean(cancelTargetMatch)}
        onClose={() => setCancelTargetMatch(null)}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
        title="Cancel Match?"
        description={`Are you sure you want to cancel "${cancelTargetMatch?.title}"? All confirmed players will receive an instant cancellation notification, and the match will be removed from discovery.`}
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Match"
        variant="danger"
      />
    </div>
  );
};

export default MyCreatedMatchesPage;
