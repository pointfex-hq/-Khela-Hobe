import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPenToSquare,
  faUsers,
  faBan,
  faTriangleExclamation,
  faChevronRight,
  faUserCheck,
  faClipboardList,
  faCalendarDays,
  faEye,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { matchService } from '../../services/endpoints/matchService';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const MatchManagementPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelNotice, setShowCancelNotice] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      setLoading(true);
      try {
        const res = await matchService.getMatchById(matchId || 'match_1');
        if (res?.data) {
          setMatch(res.data);
        }
      } catch {
        toastService.error('Failed to load match details.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  const handleCancelMatch = async () => {
    setIsCancelling(true);
    try {
      const res = await matchService.cancelMatch(match.id);
      if (res?.success) {
        toastService.success('Match cancelled. All registered players have been notified.');
        setShowCancelNotice(false);
        setConfirmModalOpen(false);
        setMatch((prev) => ({ ...prev, state: 'cancelled', status: 'CANCELLED' }));
      } else {
        toastService.error(res?.message || 'Could not cancel match.');
      }
    } catch {
      toastService.error('Failed to cancel match.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading match management console..." />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center">
        <p className="text-light-muted dark:text-dark-muted">Match not found.</p>
        <Link to={ROUTES.ORGANIZER_MATCHES} className="text-primary hover:underline mt-2 inline-block">
          Return to Created Matches
        </Link>
      </div>
    );
  }

  const isCancelled = match.state === 'cancelled' || match.status === 'CANCELLED';
  const remainingSlots = Math.max(0, match.totalSlots - match.filledSlots);
  const checkedInCount = 4; // Mock checked in count from UIUX reference
  const equipmentItems = match.equipment && match.equipment.length > 0
    ? match.equipment
    : [
        { id: 'eq_1', name: 'Size 5 Match Football', required: 2, committed: 2, remaining: 0 },
        { id: 'eq_2', name: 'Training Bibs (Set of 7)', required: 2, committed: 1, remaining: 1 },
        { id: 'eq_3', name: 'First Aid & Ice Pack', required: 1, committed: 0, remaining: 1 },
      ];

  const totalRequired = equipmentItems.reduce((acc, eq) => acc + (eq.required || eq.quantity || 1), 0);
  const totalCommitted = equipmentItems.reduce((acc, eq) => acc + (eq.committed || 0), 0);
  const coveragePercent = totalRequired > 0 ? Math.round((totalCommitted / totalRequired) * 100) : 100;
  const remainingEquipCount = equipmentItems.reduce((acc, eq) => {
    const rem = eq.remaining !== undefined ? eq.remaining : Math.max(0, (eq.required || 1) - (eq.committed || 0));
    return acc + rem;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Contextual Header (Parity with UIUX/match_management/code.html lines 236-261) */}
      <header className="sticky top-0 z-20 min-h-16 py-2 border-b border-light-border dark:border-dark-border bg-light-background/95 dark:bg-dark-background/95 backdrop-blur-md px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ORGANIZER_MATCHES}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors"
            aria-label="Back to Created Matches"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-title-lg font-bold">Match Management</h1>
              {isCancelled && (
                <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-label text-xs font-semibold">
                  Cancelled
                </span>
              )}
            </div>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              {match.title} • {match.date}, {match.time}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isCancelled && (
            <>
              <Link
                to={ROUTES.ORGANIZER_MATCH_EDIT.replace(':matchId', match.id)}
                className="shrink-0 px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="text-xs text-light-muted dark:text-dark-muted" />
                <span>Edit Match</span>
              </Link>
              <Link
                to={ROUTES.ORGANIZER_PARTICIPANTS.replace(':matchId', match.id)}
                className="shrink-0 px-3.5 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faUsers} className="text-xs" />
                <span>Manage Roster</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowCancelNotice(true)}
                className="shrink-0 px-3.5 py-2 rounded-md border border-error text-error font-label text-label-md hover:bg-error hover:text-on-error transition-colors flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faBan} className="text-xs" />
                <span>Cancel Match</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Inline Cancel Notice Banner (Lines 264-273) */}
      {showCancelNotice && !isCancelled && (
        <div className="p-4 rounded-lg bg-error/10 border border-error flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-error text-xl shrink-0" />
            <div>
              <p className="font-label text-label-md font-semibold text-error">
                Cancel this match session?
              </p>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
                All confirmed players will receive an automated cancellation notification and booking passes will be invalidated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCancelNotice(false)}
              className="px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md transition-colors hover:border-primary"
            >
              Keep Match
            </button>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              className="px-3.5 py-2 rounded-md bg-error text-on-error font-label text-label-md font-semibold hover:opacity-90 transition-opacity"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      )}

      {/* Capacity & Stats Grid (Lines 276-300) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-1.5">
          <span className="font-label text-label-sm uppercase tracking-wider text-light-muted dark:text-dark-muted">
            Capacity
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums">
            {match.filledSlots} / {match.totalSlots} players
          </p>
          <span className="font-body text-body-sm text-success tabular-nums font-medium">
            {remainingSlots > 0 ? `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left` : 'Roster Full'}
          </span>
        </div>

        {/* Checked-In */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-1.5">
          <span className="font-label text-label-sm uppercase tracking-wider text-light-muted dark:text-dark-muted">
            Checked-In
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums">
            {checkedInCount} / {match.filledSlots}
          </p>
          <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
            Check-in opens 30m prior
          </span>
        </div>

        {/* Equipment Coverage */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-1.5">
          <span className="font-label text-label-sm uppercase tracking-wider text-light-muted dark:text-dark-muted">
            Equipment Coverage
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums text-primary">
            {coveragePercent}%
          </p>
          <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
            {remainingEquipCount === 0 ? 'All gear confirmed' : `${remainingEquipCount} item${remainingEquipCount === 1 ? '' : 's'} remaining`}
          </span>
        </div>

        {/* Turf Fee Split */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-1.5">
          <span className="font-label text-label-sm uppercase tracking-wider text-light-muted dark:text-dark-muted">
            Turf Fee Split
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums">
            {match.turfFee || 'BDT 250'}
          </p>
          <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
            Per player • Pay at venue
          </span>
        </div>
      </section>

      {/* Equipment Progress & Quick Actions (Lines 303-380) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Equipment Pledge Progress Table (7 columns) */}
        <section className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline text-title-lg font-bold">Equipment Pledge Progress</h2>
            <Link
              to={ROUTES.MATCH_DETAILS.replace(':matchId', match.id)}
              className="font-label text-label-md text-primary hover:underline flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faEye} className="text-xs" />
              <span>View Public Page</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border font-label text-label-sm uppercase text-light-muted dark:text-dark-muted">
                  <th className="py-2.5 pr-4">Item</th>
                  <th className="py-2.5 px-3 tabular-nums">Required</th>
                  <th className="py-2.5 px-3 tabular-nums">Committed</th>
                  <th className="py-2.5 pl-3 tabular-nums">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border font-body text-body-md">
                {equipmentItems.map((item, idx) => {
                  const req = item.required || item.quantity || 1;
                  const com = item.committed !== undefined ? item.committed : (idx === 0 ? req : 0);
                  const rem = item.remaining !== undefined ? item.remaining : Math.max(0, req - com);

                  return (
                    <tr key={item.id || idx}>
                      <td className="py-3 pr-4 font-medium">{item.name}</td>
                      <td className="py-3 px-3 tabular-nums">{req}</td>
                      <td className={`py-3 px-3 tabular-nums font-semibold ${com >= req ? 'text-success' : 'text-warning'}`}>
                        {com}
                      </td>
                      <td className={`py-3 pl-3 tabular-nums font-semibold ${rem > 0 ? 'text-accent' : 'text-light-muted dark:text-dark-muted'}`}>
                        {rem}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Organizer Quick Controls (5 columns) */}
        <section className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
          <h2 className="font-headline text-title-lg font-bold">Organizer Controls</h2>
          <div className="flex flex-col gap-3">
            {/* Control 1: Participant Check-In & Roster */}
            <Link
              to={ROUTES.ORGANIZER_PARTICIPANTS.replace(':matchId', match.id)}
              className="flex items-center justify-between p-3.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faUserCheck} className="text-base" />
                </span>
                <div>
                  <p className="font-label text-label-md font-semibold group-hover:text-primary transition-colors">
                    Participant Check-In &amp; Roster
                  </p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                    {match.filledSlots} confirmed players
                  </p>
                </div>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-xs text-light-muted dark:text-dark-muted" />
            </Link>

            {/* Control 2: Switch Join Mode / Review Requests */}
            <Link
              to={ROUTES.ORGANIZER_MATCH_APPLICATIONS.replace(':matchId', match.id)}
              className="flex items-center justify-between p-3.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-md bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faClipboardList} className="text-base" />
                </span>
                <div>
                  <p className="font-label text-label-md font-semibold group-hover:text-primary transition-colors">
                    Switch Join Mode / Review Requests
                  </p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                    {match.joinMode === 'approval' ? 'Approval Required (Pending reviews)' : 'Currently Open Join'}
                  </p>
                </div>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-xs text-light-muted dark:text-dark-muted" />
            </Link>

            {/* Control 3: Update Time or Venue Notes */}
            <Link
              to={ROUTES.ORGANIZER_MATCH_EDIT.replace(':matchId', match.id)}
              className="flex items-center justify-between p-3.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border hover:border-primary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-md bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-base" />
                </span>
                <div>
                  <p className="font-label text-label-md font-semibold group-hover:text-primary transition-colors">
                    Update Time or Venue Notes
                  </p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                    Notifies all confirmed players
                  </p>
                </div>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-xs text-light-muted dark:text-dark-muted" />
            </Link>
          </div>
        </section>
      </div>

      {/* Confirmation Dialog for Destructive Cancel */}
      <ConfirmationDialog
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleCancelMatch}
        isLoading={isCancelling}
        title="Confirm Match Cancellation"
        description="Are you certain you want to cancel this match? Confirmed players will be notified via SMS/push and your schedule will update immediately."
        confirmLabel="Yes, Cancel Match"
        cancelLabel="Keep Match"
        variant="danger"
      />
    </div>
  );
};

export default MatchManagementPage;
