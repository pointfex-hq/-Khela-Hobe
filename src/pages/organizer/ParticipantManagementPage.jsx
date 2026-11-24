import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faMagnifyingGlass,
  faUsers,
  faUserCheck,
  faTrashCan,
  faShieldHalved,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { participantService } from '../../services/endpoints/participantService';
import { matchService } from '../../services/endpoints/matchService';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const ParticipantManagementPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Destructive remove state
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const targetMatchId = matchId || 'match_1';
      const [matchRes, partRes] = await Promise.all([
        matchService.getMatchById(targetMatchId),
        participantService.getMatchParticipants(targetMatchId),
      ]);

      if (matchRes?.data) {
        setMatch(matchRes.data);
      }
      if (partRes?.data) {
        setParticipants(partRes.data);
      }
    } catch {
      toastService.error('Failed to load participants roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [matchId]);

  // Filter participants
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.experience?.toLowerCase().includes(q) ||
        p.skill?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q)
    );
  }, [participants, searchQuery]);

  // Handle Remove Participant
  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      const targetMatchId = matchId || 'match_1';
      const res = await participantService.removeParticipant(targetMatchId, removeTarget.id);
      if (res?.success) {
        setParticipants((prev) => prev.filter((p) => p.id !== removeTarget.id));
        setMatch((prev) => ({
          ...prev,
          filledSlots: Math.max(0, (prev?.filledSlots || 1) - 1),
        }));
        toastService.success(`${removeTarget.name} removed from match roster.`);
        setRemoveTarget(null);
      } else {
        toastService.error(res?.message || 'Could not remove participant.');
      }
    } catch {
      toastService.error('Failed to remove participant.');
    } finally {
      setIsRemoving(false);
    }
  };

  const totalSlots = match?.totalSlots || 14;
  const currentCount = participants.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Contextual Header (Parity with UIUX/participant_management/code.html lines 274-290) */}
      <header className="sticky top-0 z-20 min-h-16 py-2 border-b border-light-border dark:border-dark-border bg-light-background/95 dark:bg-dark-background/95 backdrop-blur-md px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (matchId) {
                navigate(ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', matchId));
              } else {
                navigate(ROUTES.ORGANIZER_MATCHES);
              }
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors"
            aria-label="Back to match management"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </button>
          <div>
            <h1 className="font-headline text-title-lg font-bold">
              Participants ({currentCount} / {totalSlots})
            </h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              {match?.title || 'Uttara Sector 11 Floodlit 7v7'}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64 shrink-0 flex items-center">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 text-light-muted dark:text-dark-muted text-sm pointer-events-none"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-9 pr-4 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
          />
        </div>
      </header>

      {/* Main Roster Container (Lines 292-357) */}
      <main className="max-w-6xl w-full mx-auto flex flex-col gap-6">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" message="Loading match roster..." />
          </div>
        ) : filteredParticipants.length === 0 ? (
          <EmptyState
            icon={faUsers}
            title="No participants found"
            description={
              searchQuery
                ? `No participants matched "${searchQuery}".`
                : 'No players have joined this match roster yet.'
            }
          />
        ) : (
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated">
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Player
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Experience
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Status
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Joined
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted text-right uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredParticipants.map((p) => {
                    const isHost = p.isHost || p.role === 'Organizer' || p.status === 'Organizer';

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-light-surface-elevated/50 dark:hover:bg-dark-surface-elevated/50 transition-colors"
                      >
                        {/* Player */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-light-border dark:ring-dark-border"
                            />
                            <span className="font-label text-label-lg font-semibold truncate">
                              {p.name}
                            </span>
                          </div>
                        </td>

                        {/* Experience */}
                        <td className="py-4 px-5 font-body text-body-md text-light-muted dark:text-dark-muted">
                          {p.experience || `${p.skill || 'Intermediate'} • ${p.matchesPlayed || 10} matches`}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {isHost ? (
                            <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label text-label-sm font-semibold">
                              Organizer
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-success text-on-success font-label text-label-sm font-semibold">
                              Confirmed
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-5 font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                          {p.joinedAt}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-5 text-right">
                          {isHost ? (
                            <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                              Host
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRemoveTarget(p)}
                              className="font-label text-label-md text-error hover:underline transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Remove Participant Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
        title="Remove Participant?"
        description={`Are you sure you want to remove "${removeTarget?.name}" from this match? Their slot will be reopened to the community immediately.`}
        confirmLabel="Remove Player"
        cancelLabel="Keep in Roster"
        variant="danger"
      />
    </div>
  );
};

export default ParticipantManagementPage;
