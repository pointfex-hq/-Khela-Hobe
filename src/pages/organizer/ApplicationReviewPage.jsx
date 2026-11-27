import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCircleInfo,
  faCheck,
  faXmark,
  faInbox,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { applicationService } from '../../services/endpoints/applicationService';
import { matchService } from '../../services/endpoints/matchService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const ApplicationReviewPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch match details (if scoped) and pending applicants across organizer's matches
  const loadData = async () => {
    setLoading(true);
    try {
      if (matchId) {
        const [matchRes, appsRes] = await Promise.all([
          matchService.getMatchById(matchId),
          applicationService.getOrganizerApplications(matchId),
        ]);
        if (matchRes?.data) {
          setMatch(matchRes.data);
        }
        if (appsRes?.data) {
          setApplications(appsRes.data.filter((a) => a.status === 'pending'));
        }
      } else {
        setMatch(null);
        const appsRes = await applicationService.getOrganizerApplications();
        if (appsRes?.data) {
          setApplications(appsRes.data.filter((a) => a.status === 'pending'));
        }
      }
    } catch {
      toastService.error('Failed to load application review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [matchId]);

  const totalSlots = match?.totalSlots || 0;
  const filledSlots = match?.filledSlots || 0;
  const remainingSlots = match ? Math.max(0, totalSlots - filledSlots) : null;
  const isCapacityFull = Boolean(match && remainingSlots <= 0);

  // Handle Accept
  const handleAccept = async (app) => {
    if (isCapacityFull) {
      toastService.error('Capacity protection active: Match roster is already full.');
      return;
    }

    setActionLoadingId(app.id);
    try {
      const targetMatchId = app.matchId || match?.id || matchId;
      const res = await applicationService.approveApplication(app.id, targetMatchId);
      if (res?.success) {
        if (match) {
          setMatch((prev) => ({
            ...prev,
            filledSlots: (prev?.filledSlots || 0) + 1,
          }));
        }
        setApplications((prev) => prev.filter((a) => a.id !== app.id));
        toastService.success(`Approved ${app.applicantName} for ${app.matchTitle || match?.title || 'match'}!`);
      } else {
        toastService.error(res?.message || 'Could not approve applicant.');
      }
    } catch (err) {
      toastService.error(err?.message || 'An error occurred while approving the application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject
  const handleReject = async (app) => {
    setActionLoadingId(app.id);
    try {
      const targetMatchId = app.matchId || match?.id || matchId;
      const res = await applicationService.rejectApplication(
        app.id,
        'Organizer declined application',
        targetMatchId
      );
      if (res?.success) {
        setApplications((prev) => prev.filter((a) => a.id !== app.id));
        toastService.success(`Application from ${app.applicantName} declined.`);
      } else {
        toastService.error(res?.message || 'Could not decline application.');
      }
    } catch (err) {
      toastService.error(err?.message || 'An error occurred while rejecting the application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Contextual Header */}
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
            <h1 className="font-headline text-title-lg font-bold">Application Review</h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              {match?.title || 'All Organized Matches Queue'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {match ? (
            <span className="px-3 py-1.5 rounded-full bg-light-surface dark:bg-dark-surface border border-primary font-label text-label-md text-primary tabular-nums font-semibold">
              {filledSlots} / {totalSlots} Filled • {remainingSlots} Slot{remainingSlots === 1 ? '' : 's'} Left
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-light-surface dark:bg-dark-surface border border-primary font-label text-label-md text-primary tabular-nums font-semibold">
              {applications.length} Pending Request{applications.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
        {/* Capacity Protection Banner */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex items-center gap-3.5">
          <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-lg shrink-0" />
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
            {match
              ? `Capacity protection is active: accepting more than ${remainingSlots} applicant${remainingSlots === 1 ? '' : 's'} is blocked automatically once the ${totalSlots}-player limit is reached.`
              : 'Showing all pending player requests across your created matches.'}
          </p>
        </div>

        {/* Pending Applicant Cards */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner size="lg" message="Loading applicants..." />
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={faInbox}
            title="All applications reviewed"
            description="There are no pending player applications right now."
            actionLabel="Back to Created Matches"
            onAction={() => {
              if (matchId) {
                navigate(ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', matchId));
              } else {
                navigate(ROUTES.ORGANIZER_MATCHES);
              }
            }}
          />
        ) : (
          <section className="flex flex-col gap-4">
            {applications.map((app) => {
              const isActionLoading = actionLoadingId === app.id;
              return (
                <article
                  key={app.id}
                  className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-primary/50"
                >
                  {/* Left: Applicant details */}
                  <div className="flex items-start gap-4">
                    {app.avatar ? (
                      <img
                        src={app.avatar}
                        alt={app.applicantName}
                        className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-headline font-bold shrink-0">
                        {(app.applicantName || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-headline text-title-md font-bold truncate">
                          {app.applicantName}
                        </h2>
                        {app.matchTitle && !match && (
                          <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-label text-xs font-semibold">
                            {app.matchTitle}
                          </span>
                        )}
                        {app.skill && (
                          <span className="px-2 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                            {app.skill}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                        {app.role || 'Player'}
                        {app.location ? ` • ${app.location}` : ''}
                      </p>
                      {app.note && (
                        <p className="font-body text-xs text-light-on-surface dark:text-dark-on-surface italic mt-0.5">
                          &ldquo;{app.note}&rdquo;
                        </p>
                      )}
                      <p className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                        Applied {app.appliedAt}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 shrink-0 sm:self-center">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleReject(app)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-light-surface dark:bg-dark-surface text-error border border-light-border dark:border-dark-border font-label text-label-md hover:border-error transition-colors disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-sm" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading || isCapacityFull}
                      onClick={() => handleAccept(app)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faCheck} className="text-sm" />
                      <span>{isCapacityFull ? 'Capacity Reached' : 'Accept'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

export default ApplicationReviewPage;
