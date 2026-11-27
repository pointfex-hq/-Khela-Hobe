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
  faPhone,
  faEnvelope,
  faFlag,
  faUserXmark,
  faClockRotateLeft,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { participantService } from '../../services/endpoints/participantService';
import { matchService } from '../../services/endpoints/matchService';
import { reportService } from '../../services/endpoints/reportService';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import MatchChatBox from '../../components/chat/MatchChatBox';
import Modal from '../../components/modals/Modal';
import RatingWidgetModal, { StarSummaryBadge } from '../../components/common/RatingWidgetModal';
import { toastService } from '../../components/feedback/toastService';
import { formatDateTimeDhaka } from '../../utils/formatters';
import { ROUTES } from '../../constants/routes';

export const ParticipantManagementPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Destructive remove, no-show, profile modal, report modal & direct chat state
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [noShowLoadingId, setNoShowLoadingId] = useState(null);
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportTopic, setReportTopic] = useState('MISCELLANEOUS');
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState('');
  const [chatMode, setChatMode] = useState('dm');
  const [chatOpen, setChatOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);

  const loadData = async () => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [matchRes, partRes] = await Promise.all([
        matchService.getMatchById(matchId),
        participantService.getMatchParticipants(matchId),
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

  const handleToggleNoShow = async (participant) => {
    const isCurrentlyNoShow = String(participant.status).toUpperCase() === 'NO_SHOW';
    setNoShowLoadingId(participant.id);
    try {
      const res = await participantService.toggleNoShow(
        matchId,
        participant.id,
        !isCurrentlyNoShow
      );
      if (res?.success) {
        toastService.success(res.message);
        await loadData();
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to update attendance status.');
    } finally {
      setNoShowLoadingId(null);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportTarget || reportReason.trim().length < 3) {
      toastService.error('Please enter at least 3 characters describing the report.');
      return;
    }
    setSubmittingReport(true);
    try {
      await reportService.createReport({
        targetType: 'USER',
        targetId: reportTarget.userId || reportTarget.id,
        targetName: reportTarget.name,
        topic: reportTopic,
        reason: reportReason.trim(),
        description: `Reported from match "${match?.title || matchId}": ${reportReason.trim()}`,
      });
      toastService.success(`Report submitted to Admin for ${reportTarget.name}.`);
      setReportTarget(null);
      setReportReason('');
    } catch (err) {
      toastService.error(err?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

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
      <header className="min-h-16 py-2 border-b border-light-border dark:border-dark-border px-2 sm:px-4 flex flex-wrap items-center justify-between gap-4">
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
            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-light-border dark:divide-dark-border">
              {filteredParticipants.map((p) => {
                const isHost = p.isHost || p.role === 'Organizer' || p.status === 'Organizer';
                const isNoShow = String(p.status).toUpperCase() === 'NO_SHOW';
                const showUpRate = p.stats?.showUpRate ?? 100;
                const played = p.stats?.matchesPlayed ?? 0;
                const noShows = p.stats?.noShowCount ?? 0;

                return (
                  <div key={`m-${p.id}`} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-light-border dark:ring-dark-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-headline text-sm font-bold shrink-0">
                            {(p.name || 'P').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-label text-sm font-bold block truncate">{p.name}</span>
                          <span className="font-body text-xs text-light-muted dark:text-dark-muted block truncate">
                            {p.phoneNumber || p.email || p.area || 'Contact via chat'}
                          </span>
                        </div>
                      </div>

                      {isHost ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-label text-xs font-semibold shrink-0">
                          Organizer
                        </span>
                      ) : isNoShow ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-error/15 text-error font-label text-xs font-semibold shrink-0">
                          No-Show
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-success text-on-success font-label text-xs font-semibold shrink-0">
                          Confirmed
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-light-muted dark:text-dark-muted bg-light-surface-elevated dark:bg-dark-surface-elevated rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-light-on-surface dark:text-dark-on-surface tabular-nums">
                          {showUpRate}% Show-Up ({played} played • {noShows} no-show)
                        </span>
                        <StarSummaryBadge average={p.stats?.ratingAvg} count={p.stats?.ratingCount} />
                      </div>
                      <span className="tabular-nums">Joined {p.joinedAt}</span>
                    </div>

                    {!isHost && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRatingTarget(p)}
                          className="px-2.5 py-1.5 rounded border border-warning/50 bg-warning/10 text-warning font-label text-xs font-semibold flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                          <span>Rate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailPlayer(p)}
                          className="px-2.5 py-1.5 rounded border border-secondary/40 text-secondary font-label text-xs font-semibold"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChatPartnerId(p.userId || p.id);
                            setChatMode('dm');
                            setChatOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded border border-primary/40 text-primary font-label text-xs font-semibold"
                        >
                          Message
                        </button>
                        <button
                          type="button"
                          disabled={noShowLoadingId === p.id}
                          onClick={() => handleToggleNoShow(p)}
                          className={`px-2.5 py-1.5 rounded border font-label text-xs font-semibold disabled:opacity-50 ${
                            isNoShow ? 'border-success/40 text-success' : 'border-warning/40 text-warning'
                          }`}
                        >
                          {isNoShow ? 'Undo No-Show' : 'No-Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTarget(p)}
                          className="px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-label text-xs"
                        >
                          Report
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(p)}
                          className="px-2.5 py-1.5 rounded border border-error/40 text-error font-label text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border bg-light-surface-elevated dark:bg-dark-surface-elevated">
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Player &amp; Contact
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Stats &amp; Show-Up Rate
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Status
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted uppercase">
                      Joined
                    </th>
                    <th className="py-3.5 px-5 font-label text-label-md text-light-muted dark:text-dark-muted text-right uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {filteredParticipants.map((p) => {
                    const isHost = p.isHost || p.role === 'Organizer' || p.status === 'Organizer';
                    const isNoShow = String(p.status).toUpperCase() === 'NO_SHOW';
                    const showUpRate = p.stats?.showUpRate ?? 100;
                    const played = p.stats?.matchesPlayed ?? 0;
                    const noShows = p.stats?.noShowCount ?? 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-light-surface-elevated/50 dark:hover:bg-dark-surface-elevated/50 transition-colors"
                      >
                        {/* Player */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {p.avatar ? (
                              <img
                                src={p.avatar}
                                alt={p.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-light-border dark:ring-dark-border"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-headline text-sm font-bold shrink-0">
                                {(p.name || 'P').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-label text-label-lg font-semibold block truncate">
                                {p.name}
                              </span>
                              <span className="font-body text-xs text-light-muted dark:text-dark-muted block truncate">
                                {p.phoneNumber || p.email || p.area || 'Contact via chat'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stats */}
                        <td className="py-4 px-5 font-body text-body-sm text-light-muted dark:text-dark-muted">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-light-on-surface dark:text-dark-on-surface tabular-nums">
                              {showUpRate}% Show-Up Rate
                            </span>
                            <span className="text-xs tabular-nums">
                              {played} played • {noShows} no-show{noShows === 1 ? '' : 's'}
                            </span>
                            <StarSummaryBadge average={p.stats?.ratingAvg} count={p.stats?.ratingCount} />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {isHost ? (
                            <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label text-label-sm font-semibold">
                              Organizer
                            </span>
                          ) : isNoShow ? (
                            <span className="px-2.5 py-1 rounded-full bg-error/15 text-error font-label text-label-sm font-semibold">
                              Did Not Show Up
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
                            <div className="inline-flex flex-wrap justify-end items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setRatingTarget(p)}
                                className="font-label text-xs text-warning hover:underline font-semibold inline-flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                                <span>Rate Player</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailPlayer(p)}
                                className="font-label text-xs text-secondary hover:underline"
                              >
                                Details &amp; History
                              </button>
                              <button
                                type="button"
                                disabled={noShowLoadingId === p.id}
                                onClick={() => handleToggleNoShow(p)}
                                className={`font-label text-xs hover:underline disabled:opacity-50 ${
                                  isNoShow ? 'text-success' : 'text-warning'
                                }`}
                              >
                                {isNoShow ? 'Undo No-Show' : 'Did Not Show Up'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setChatPartnerId(p.userId || p.id);
                                  setChatMode('dm');
                                  setChatOpen(true);
                                }}
                                className="font-label text-xs text-primary hover:underline transition-colors"
                              >
                                Message
                              </button>
                              <button
                                type="button"
                                onClick={() => setReportTarget(p)}
                                className="font-label text-xs text-light-muted dark:text-dark-muted hover:text-error"
                              >
                                Report
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemoveTarget(p)}
                                className="font-label text-xs text-error hover:underline transition-colors"
                              >
                                Remove
                              </button>
                            </div>
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

        {chatOpen && match && (
          <div className="mt-6">
            <MatchChatBox
              key={`${chatMode}-${chatPartnerId}`}
              matchId={match.id}
              matchTitle={match.title}
              initialMode={chatMode}
              initialPartnerId={chatPartnerId}
              onClose={() => setChatOpen(false)}
            />
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

      {/* Player Contact, Stats & History Modal */}
      <Modal
        isOpen={Boolean(detailPlayer)}
        onClose={() => setDetailPlayer(null)}
        title={detailPlayer ? `${detailPlayer.name} — Player Details & History` : 'Player Details'}
        maxWidth="max-w-lg"
      >
        {detailPlayer && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs">
              <div>
                <span className="text-light-muted dark:text-dark-muted block">Phone Number</span>
                <strong className="font-mono">{detailPlayer.phoneNumber || 'Not provided'}</strong>
              </div>
              <div>
                <span className="text-light-muted dark:text-dark-muted block">Email</span>
                <strong className="truncate block">{detailPlayer.email || 'Not provided'}</strong>
              </div>
              <div>
                <span className="text-light-muted dark:text-dark-muted block">Area / City</span>
                <strong>{[detailPlayer.area, detailPlayer.city].filter(Boolean).join(', ') || 'Bangladesh'}</strong>
              </div>
              <div>
                <span className="text-light-muted dark:text-dark-muted block">Skill Level</span>
                <strong>{detailPlayer.skillLevel || detailPlayer.skill || 'Intermediate'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border">
                <p className="font-headline text-lg font-bold text-primary tabular-nums">
                  {detailPlayer.stats?.matchesPlayed ?? 0}
                </p>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">Matches Played</p>
              </div>
              <div className="p-3 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border">
                <p className="font-headline text-lg font-bold text-error tabular-nums">
                  {detailPlayer.stats?.noShowCount ?? 0}
                </p>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">No-Shows</p>
              </div>
              <div className="p-3 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border">
                <p className="font-headline text-lg font-bold text-success tabular-nums">
                  {detailPlayer.stats?.showUpRate ?? 100}%
                </p>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">Show-Up Rate</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              <span className="font-label text-xs uppercase font-semibold text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClockRotateLeft} />
                <span>Recent Match Participation History</span>
              </span>
              {Array.isArray(detailPlayer.matchHistory) && detailPlayer.matchHistory.length > 0 ? (
                detailPlayer.matchHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold">{h.title}</p>
                      <p className="text-light-muted dark:text-dark-muted">
                        {h.sport} • {typeof h.date === 'number' ? formatDateTimeDhaka(h.date) : ''}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        h.status === 'Did Not Show Up'
                          ? 'bg-error/15 text-error'
                          : 'bg-success/15 text-success'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-light-muted dark:text-dark-muted">No prior match history found.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Report Player to Admin Modal */}
      <Modal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title={reportTarget ? `Report ${reportTarget.name} to Admin` : 'Report Player'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-label text-xs font-semibold">Category</span>
            <select
              value={reportTopic}
              onChange={(e) => setReportTopic(e.target.value)}
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm"
            >
              <option value="MISCELLANEOUS">No-Show / Unsportsmanlike Conduct</option>
              <option value="HARASSMENT">Harassment or Verbal Abuse</option>
              <option value="INAPPROPRIATE_CONTENT">Fake Profile / Misconduct</option>
              <option value="SPAM">Spam / Disruptive Behavior</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-xs font-semibold">Details for Admin Review</span>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Explain what happened during the match..."
              className="px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm resize-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportTarget(null)}
              className="px-4 py-2 rounded-md border border-light-border dark:border-dark-border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReport}
              className="px-4 py-2 rounded-md bg-error text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {submittingReport ? 'Submitting...' : 'Submit Report to Admin'}
            </button>
          </div>
        </form>
      </Modal>

      <RatingWidgetModal
        isOpen={Boolean(ratingTarget)}
        onClose={() => setRatingTarget(null)}
        targetUserId={ratingTarget?.userId || ratingTarget?.id}
        targetName={ratingTarget?.name}
        matchId={matchId}
        contextRole="ORGANIZER_TO_PLAYER"
        onSubmitted={loadData}
      />
    </div>
  );
};

export default ParticipantManagementPage;
