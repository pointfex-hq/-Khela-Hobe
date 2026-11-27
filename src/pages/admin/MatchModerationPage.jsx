import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faBolt,
  faTriangleExclamation,
  faCheckCircle,
  faBan,
  faEye,
  faFlag,
  faCalendarCheck,
  faLocationDot,
  faUser,
  faClock,
  faShieldHalved,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { moderationService } from '../../services/endpoints/moderationService';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import Modal from '../../components/modals/Modal';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';

export const MatchModerationPage = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('All Sports');
  const [statusFilter, setStatusFilter] = useState('Flagged Only');

  // Inspection Modal
  const [inspectedMatch, setInspectedMatch] = useState(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // Moderation Dialog State
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    match: null,
    action: 'suspend', // 'suspend', 'approve', 'flag'
  });

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await moderationService.getPendingMatches({
        search,
        sport: sportFilter,
        status: statusFilter,
      });
      if (res.success) {
        setMatches(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load matches for moderation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [sportFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMatches();
  };

  const openActionDialog = (match, action) => {
    setDialogState({
      isOpen: true,
      match,
      action,
    });
  };

  const handleConfirmModeration = async () => {
    if (!dialogState.match) return;
    const { match, action } = dialogState;

    try {
      const res = await moderationService.moderateMatch(match.id, { action });
      if (res.success) {
        toastService.success(res.message);
        fetchMatches();
      }
    } catch {
      toastService.error('Failed to apply moderation action.');
    } finally {
      setDialogState({ isOpen: false, match: null, action: 'suspend' });
    }
  };

  const openInspectModal = (match) => {
    setInspectedMatch(match);
    setIsInspectModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl w-full mx-auto pb-16">
      {/* Top Header & Filters (Reference lines 224-243 in UIUX/admin_match_moderation/code.html) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
            Match Moderation
          </h1>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            Investigate flagged Quick Matches, safety reports, and policy violations across Bangladesh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by sport"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>All Sports</option>
            <option>Football</option>
            <option>Badminton</option>
            <option>Cricket</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs sm:text-sm text-light-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>Flagged Only</option>
            <option>All Matches</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matches by ID (e.g. KH-M-4099), venue, or organizer..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface placeholder:text-light-muted dark:placeholder:text-dark-muted font-body text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-3 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      {/* Policy Clarification Banner (Reference lines 245-250) */}
      <div className="rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 flex items-center gap-3 shadow-sm">
        <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faBolt} className="text-sm" />
        </span>
        <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted leading-relaxed">
          <strong className="text-light-on-surface dark:text-dark-on-surface font-semibold">
            Post-Publication Moderation:
          </strong>{' '}
          Quick Matches publish immediately without pre-approval. Use this console to investigate player
          reports and suspend unsafe listings.
        </p>
      </div>

      {/* Moderation Cards List (Reference lines 253-288) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px]">
          <LoadingSpinner size="lg" text="Loading match moderation queue..." />
        </div>
      ) : matches.length > 0 ? (
        <div className="flex flex-col gap-4">
          {matches.map((match) => {
            const isFlagged = match.status === 'Flagged';
            const isPublished = match.status === 'Published';
            const isSuspended = match.status === 'Suspended';

            return (
              <article
                key={match.id}
                className={`rounded-lg bg-light-surface dark:bg-dark-surface p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all shadow-sm ${
                  isFlagged
                    ? 'border-2 border-warning'
                    : isSuspended
                    ? 'border border-error/50 bg-error/[0.02]'
                    : 'border border-light-border dark:border-dark-border'
                }`}
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {isFlagged ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-warning text-on-warning font-label text-xs font-semibold shrink-0">
                        {match.reportsCount} Safety Reports
                      </span>
                    ) : isPublished ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-success text-on-success font-label text-xs font-semibold shrink-0">
                        Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-error text-on-error font-label text-xs font-semibold shrink-0">
                        Suspended
                      </span>
                    )}

                    <span className="font-mono text-xs text-primary font-bold">
                      {match.id}
                    </span>

                    <span className="font-body text-xs text-light-muted dark:text-dark-muted">
                      {match.sport} • Roster: {match.rosterCount}
                    </span>
                  </div>

                  <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                    {match.title}
                  </h2>

                  <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted leading-relaxed">
                    {match.venue} • {match.schedule} • Organizer:{' '}
                    <strong className="text-light-on-surface dark:text-dark-on-surface">
                      {match.organizerName}
                    </strong>
                    {match.flagReason && (
                      <span className="text-warning block mt-0.5">
                        Flag Reason: &ldquo;{match.flagReason}&rdquo;
                      </span>
                    )}
                  </p>
                </div>

                {/* Moderation Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-light-border dark:border-dark-border">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={faEye}
                    onClick={() => openInspectModal(match)}
                  >
                    Inspect Listing
                  </Button>

                  {isFlagged && (
                    <>
                      <Button
                        variant="tertiary"
                        size="sm"
                        icon={faFlag}
                        onClick={() => navigate(ROUTES.ADMIN_REPORTS)}
                      >
                        Investigate Reports
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        className="!bg-error !text-on-error hover:!opacity-90"
                        icon={faBan}
                        onClick={() => openActionDialog(match, 'suspend')}
                      >
                        Suspend Match
                      </Button>
                    </>
                  )}

                  {isSuspended && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={faCheckCircle}
                      onClick={() => openActionDialog(match, 'approve')}
                    >
                      Reactivate Match
                    </Button>
                  )}

                  {isPublished && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="!text-warning !border-warning/60 hover:!bg-warning/10"
                      icon={faFlag}
                      onClick={() => openActionDialog(match, 'flag')}
                    >
                      Flag for Review
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={faCalendarCheck}
          title="No matches found in this queue"
          description="All published matches are currently operating without safety reports or open moderation flags."
          actionText="Show All Matches"
          onAction={() => {
            setSearch('');
            setSportFilter('All Sports');
            setStatusFilter('All Matches');
          }}
        />
      )}

      {/* Inspect Match Modal */}
      {inspectedMatch && (
        <Modal
          isOpen={isInspectModalOpen}
          onClose={() => setIsInspectModalOpen(false)}
          title={`Match Dossier: ${inspectedMatch.id}`}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-4 py-2">
            <div>
              <span className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                {inspectedMatch.title}
              </span>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
                {inspectedMatch.sport} • ID: {inspectedMatch.id}
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs font-body">
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Venue</span>
                <span className="font-semibold text-right">{inspectedMatch.venue}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Schedule</span>
                <span className="font-semibold text-right">{inspectedMatch.schedule}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Organizer</span>
                <span className="font-semibold text-right">
                  {inspectedMatch.organizerName} ({inspectedMatch.organizerId})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Roster Capacity</span>
                <span className="font-mono text-right">{inspectedMatch.rosterCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-light-border dark:border-dark-border">
                <span className="text-light-muted dark:text-dark-muted">Moderation Status</span>
                <Badge
                  variant={
                    inspectedMatch.status === 'Published'
                      ? 'success'
                      : inspectedMatch.status === 'Flagged'
                      ? 'warning'
                      : 'error'
                  }
                  size="sm"
                >
                  {inspectedMatch.status}
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-light-muted dark:text-dark-muted">Safety Reports</span>
                <span className="font-mono text-warning font-bold text-right">
                  {inspectedMatch.reportsCount} active flags
                </span>
              </div>
            </div>

            {inspectedMatch.description && (
              <div className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-body text-light-muted dark:text-dark-muted">
                {inspectedMatch.description}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsInspectModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Moderation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, match: null, action: 'suspend' })}
        onConfirm={handleConfirmModeration}
        title={
          dialogState.action === 'suspend'
            ? `Suspend Match: ${dialogState.match?.id}?`
            : dialogState.action === 'approve'
            ? `Reactivate Match: ${dialogState.match?.id}?`
            : `Flag Match: ${dialogState.match?.id}?`
        }
        message={
          dialogState.action === 'suspend'
            ? `Are you sure you want to suspend "${dialogState.match?.title}"? The match will be delisted from public discovery immediately.`
            : dialogState.action === 'approve'
            ? `Restore "${dialogState.match?.title}" to Published status? All active flags will be cleared.`
            : `Flag "${dialogState.match?.title}" for priority safety investigation?`
        }
        confirmText={
          dialogState.action === 'suspend'
            ? 'Suspend Match'
            : dialogState.action === 'approve'
            ? 'Reactivate Match'
            : 'Flag Match'
        }
        confirmVariant={dialogState.action === 'suspend' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default MatchModerationPage;
