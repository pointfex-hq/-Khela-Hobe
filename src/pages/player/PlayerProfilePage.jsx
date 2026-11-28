import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faPenToSquare,
  faFutbol,
  faCircleCheck,
  faShieldHalved,
  faLocationDot,
  faClock,
  faCalendarCheck,
  faMedal,
  faUsers,
  faShareNodes,
  faPhone,
  faCopy,
  faCheck,
  faXmark,
  faStar,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { profileService } from '../../services/endpoints/profileService';
import { childService } from '../../services/endpoints/childService';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import DeleteAccountCard from '../../components/auth/DeleteAccountCard';
import { toastService } from '../../components/feedback/toastService';
import { formatDateTimeDhaka } from '../../utils/formatters';
import { formatProfileGenderLabel } from '../../utils/matchEligibility';

export const PlayerProfilePage = () => {
  const { playerId } = useParams();
  const isPublicView = Boolean(playerId);
  const { updateUserState } = useAuth();
  const [profile, setProfile] = useState(null);
  const [guardianRequests, setGuardianRequests] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [togglingParental, setTogglingParental] = useState(false);
  const [togglingHost, setTogglingHost] = useState(false);
  const [applyingOrganizer, setApplyingOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, guardRes] = await Promise.all([
        profileService.getPlayerProfile(playerId),
        isPublicView
          ? Promise.resolve({ data: [] })
          : childService.getIncomingRequests().catch(() => ({ data: [] })),
      ]);
      if (res?.data) {
        setProfile(res.data);
      }
      setGuardianRequests(guardRes?.data || []);
    } catch {
      toastService.error('Failed to load player profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId]);

  const handleCopySafetyId = async () => {
    if (!profile?.safetyId) return;
    try {
      await navigator.clipboard.writeText(profile.safetyId);
      toastService.success(`Copied Safety ID: ${profile.safetyId}`);
    } catch {
      toastService.info(`Your Safety ID is: ${profile.safetyId}`);
    }
  };

  const handleRespondGuardian = async (requestId, action) => {
    setRespondingId(requestId);
    try {
      const res = await childService.respondToRequest(requestId, action);
      toastService.success(res.message);
      await loadData();
    } catch (err) {
      toastService.error(err?.message || 'Unable to respond to guardian link request.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleToggleParentalControl = async () => {
    const nextState = !Boolean(profile?.parentalControlEnabled);
    setTogglingParental(true);
    try {
      const res = await profileService.toggleParentalControl(nextState);
      if (res?.data) {
        setProfile((prev) => ({ ...(prev || {}), ...res.data }));
        updateUserState(res.data);
      }
      toastService.success(res.message);
    } catch (err) {
      toastService.error(err?.message || 'Could not update Parental Control setting.');
    } finally {
      setTogglingParental(false);
    }
  };

  const handleToggleQuickMatchHost = async () => {
    const nextState = !Boolean(profile?.quickMatchHostEnabled);
    setTogglingHost(true);
    try {
      const res = await profileService.toggleQuickMatchHost(nextState);
      if (res?.data) {
        setProfile((prev) => ({ ...(prev || {}), ...res.data }));
        updateUserState(res.data);
      }
      toastService.success(res.message);
    } catch (err) {
      toastService.error(err?.message || 'Could not update Quick Match Host mode.');
    } finally {
      setTogglingHost(false);
    }
  };

  const handleApplyOrganizer = async () => {
    setApplyingOrganizer(true);
    try {
      const res = await profileService.applyForOrganizer();
      if (res?.data) {
        setProfile((prev) => ({ ...(prev || {}), ...res.data }));
        updateUserState(res.data);
      }
      toastService.success(res.message);
    } catch (err) {
      toastService.error(err?.message || 'Unable to submit Organizer application yet.');
    } finally {
      setApplyingOrganizer(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading athlete profile..." />
      </div>
    );
  }

  const sports = profile?.sportsPreferences || [];
  const stats = profile?.stats || {
    matchesPlayed: 0,
    matchesOrganized: 0,
    showUpRate: 0,
  };
  const history = profile?.matchHistory || [];

  return (
    <div className="flex flex-col gap-8 max-w-6xl w-full mx-auto">
      {/* Profile Header Card */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile?.name || 'Athlete'}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary ring-4 ring-primary/10 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/15 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-sm shrink-0 flex items-center justify-center font-headline text-2xl font-bold uppercase">
              {(profile?.name || profile?.email || 'A').charAt(0)}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-headline text-headline-md font-bold tracking-tight">
                {profile?.name || 'Athlete'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-label text-xs font-semibold">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                <span>Verified Athlete</span>
              </span>
              {profile?.emailVerified || profile?.googleLinked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/15 text-success font-label text-xs font-semibold">
                  <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                  <span>Email Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning/15 text-warning font-label text-xs font-semibold">
                  <span>Email Unverified</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 font-body text-body-md text-light-muted dark:text-dark-muted">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faLocationDot} className="text-secondary text-xs" />
                <span>
                  {[profile?.area, profile?.city].filter(Boolean).join(', ') || 'Location not set'}
                </span>
              </span>
              {profile?.phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPhone} className="text-primary text-xs" />
                  <span className="tabular-nums">{profile.phoneNumber}</span>
                </span>
              )}
              {typeof profile?.age === 'number' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-label font-semibold tabular-nums">
                  {profile.age} yrs
                </span>
              )}
              {profile?.gender && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-xs font-label font-semibold">
                  {formatProfileGenderLabel(profile.gender)}
                </span>
              )}
            </div>

            {!isPublicView && (!profile?.age || !profile?.gender) && (
              <div className="mt-1 px-3 py-2 rounded-md bg-warning/10 border border-warning/30 text-xs text-warning flex flex-wrap items-center justify-between gap-2">
                <span>
                  Add your <strong>Age</strong> &amp; <strong>Gender</strong> in your profile to unlock age-range and Boys Only / Girls Only match discovery.
                </span>
                <Link
                  to={ROUTES.PLAYER_PROFILE_EDIT}
                  className="font-label font-bold underline hover:opacity-80 shrink-0"
                >
                  Update Now
                </Link>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/10 border border-secondary/30 text-xs font-mono font-semibold text-light-on-surface dark:text-dark-on-surface break-all max-w-full">
                <FontAwesomeIcon icon={faShieldHalved} className="text-secondary" />
                <span>Safety ID: {profile?.safetyId || 'N/A'}</span>
                {profile?.safetyId && (
                  <button
                    type="button"
                    onClick={handleCopySafetyId}
                    className="ml-1 text-primary hover:opacity-80"
                    title="Copy Safety ID"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </button>
                )}
              </span>
            </div>

            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted max-w-prose mt-0.5">
              {profile?.bio || 'No player bio added yet.'}
            </p>
          </div>
        </div>

        {!isPublicView && (
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <Link
              to={ROUTES.PLAYER_PROFILE_EDIT}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md font-medium hover:border-primary transition-colors"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-xs text-light-muted dark:text-dark-muted" />
              <span>Edit Profile</span>
            </Link>
          </div>
        )}
      </section>

      {!isPublicView && (
        <>
      {/* Parental Control Feature Toggle & Quick Hub */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-title-lg font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-primary" />
              <span>Parental Control &amp; Youth Supervision</span>
            </h2>
            <p className="font-body text-xs sm:text-body-sm text-light-muted dark:text-dark-muted mt-1">
              Enable Parental Control on your account to unlock Guardian oversight features alongside your Player profile.
              {profile?.safetyId && (
                <span className="block mt-1">
                  Note: Your personal Safety ID is <strong className="font-mono text-primary">{profile.safetyId}</strong> — use a dependent&apos;s Safety ID when linking (never your own).
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={togglingParental}
            onClick={handleToggleParentalControl}
            className={`shrink-0 px-4 py-2.5 rounded-md font-label text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 ${
              profile?.parentalControlEnabled
                ? 'bg-success text-on-success hover:opacity-90'
                : 'bg-primary text-on-primary hover:opacity-90'
            }`}
          >
            {togglingParental
              ? 'Updating...'
              : profile?.parentalControlEnabled
                ? 'Parental Control Enabled (Turn Off)'
                : 'Enable Parental Control'}
          </button>
        </div>

        {profile?.parentalControlEnabled && (
          <div className="pt-3 border-t border-light-border dark:border-dark-border grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              to={ROUTES.GUARDIAN_DASHBOARD}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              Guardian Overview
            </Link>
            <Link
              to={ROUTES.GUARDIAN_CHILDREN}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              Linked Children
            </Link>
            <Link
              to={ROUTES.GUARDIAN_CHILD_ACTIVITY}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              Child Activity
            </Link>
            <Link
              to={ROUTES.GUARDIAN_SAFETY}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              Safety &amp; Alerts
            </Link>
          </div>
        )}
      </section>

      {/* Quick Match Host & Full Organizer Pathway */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-title-lg font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faFutbol} className="text-primary" />
              <span>Quick Match Host &amp; Organizer Pathway</span>
            </h2>
            <p className="font-body text-xs sm:text-body-sm text-light-muted dark:text-dark-muted mt-1">
              Verified players can host recreational Quick Matches and review player applications. Host fees are collected strictly at the venue (Event, Ticket &amp; Online Payment tools require Full Organizer approval).
            </p>
          </div>

          <button
            type="button"
            disabled={togglingHost || !(profile?.emailVerified || profile?.googleLinked)}
            onClick={handleToggleQuickMatchHost}
            className={`shrink-0 px-4 py-2.5 rounded-md font-label text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 ${
              profile?.quickMatchHostEnabled
                ? 'bg-success text-on-success hover:opacity-90'
                : 'bg-primary text-on-primary hover:opacity-90'
            }`}
          >
            {togglingHost
              ? 'Updating...'
              : profile?.quickMatchHostEnabled
                ? 'Quick Match Host Active (Turn Off)'
                : profile?.emailVerified || profile?.googleLinked
                  ? 'Enable Quick Match Host'
                  : 'Verify Email to Unlock'}
          </button>
        </div>

        {profile?.quickMatchHostEnabled && (
          <div className="pt-3 border-t border-light-border dark:border-dark-border grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Link
              to={ROUTES.CREATE_QUICK_MATCH}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              + Create Quick Match
            </Link>
            <Link
              to={ROUTES.ORGANIZER_MATCHES}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              My Created Matches
            </Link>
            <Link
              to={ROUTES.ORGANIZER_APPLICATIONS}
              className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary text-xs font-label font-semibold text-center"
            >
              Review Applications
            </Link>
          </div>
        )}

        {/* Organizer Promotion Progress */}
        {!profile?.roles?.includes('ORGANIZER') && (
          <div className="p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-label font-semibold mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTrophy} className="text-accent" />
                  <span>Full Organizer Eligibility</span>
                </span>
                <span className="tabular-nums text-primary">
                  {Math.min(
                    profile?.stats?.completedHostedMatches ?? 0,
                    profile?.organizerEligibilityThreshold ?? 3
                  )}{' '}
                  / {profile?.organizerEligibilityThreshold ?? 3} Completed Matches
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (((profile?.stats?.completedHostedMatches ?? 0) /
                          (profile?.organizerEligibilityThreshold ?? 3)) *
                          100)
                      )
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1.5">
                {profile?.organizerApprovalStatus === 'PENDING'
                  ? 'Application submitted! Waiting for Admin approval to unlock Events, Tickets & Payouts.'
                  : profile?.canApplyForOrganizer
                    ? 'You met the hosted matches milestone! Apply for Full Organizer profile access.'
                    : `Host and complete ${profile?.organizerEligibilityThreshold ?? 3} Quick Matches to unlock Full Organizer applications.`}
              </p>
            </div>

            {profile?.organizerApprovalStatus === 'PENDING' ? (
              <span className="px-3 py-1.5 rounded-full bg-warning/15 text-warning font-label text-xs font-semibold shrink-0">
                Approval Pending
              </span>
            ) : (
              <button
                type="button"
                disabled={!profile?.canApplyForOrganizer || applyingOrganizer}
                onClick={handleApplyOrganizer}
                className="shrink-0 px-4 py-2 rounded-md bg-accent text-on-accent font-label text-xs font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {applyingOrganizer ? 'Submitting...' : 'Apply for Organizer Profile'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Incoming Guardian Safety Link Requests */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-title-lg font-bold flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-secondary" />
              <span>Guardian Safety Connections</span>
            </h2>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Accept or reject guardians who request access using your Safety ID ({profile?.safetyId || 'N/A'}).
            </p>
          </div>
        </div>

        {guardianRequests.length === 0 ? (
          <div className="p-4 rounded-md border border-dashed border-light-border dark:border-dark-border text-xs font-body text-light-muted dark:text-dark-muted">
            No pending or active guardian link requests right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guardianRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 sm:p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-headline text-sm font-bold truncate">
                    {req.guardianName} ({req.relationship})
                  </p>
                  <p className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
                    {req.guardianEmail || req.guardianPhone || 'Verified Khela Hobe Guardian'}
                  </p>
                </div>

                {req.status === 'VERIFIED' ? (
                  <span className="px-2.5 py-1 rounded-full bg-success/15 text-success font-label text-xs font-semibold shrink-0">
                    Connected
                  </span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={respondingId === req.id}
                      onClick={() => handleRespondGuardian(req.id, 'ACCEPT')}
                      className="px-3 py-1.5 rounded-md bg-success text-on-success font-label text-xs font-semibold hover:opacity-90 flex items-center gap-1 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === req.id}
                      onClick={() => handleRespondGuardian(req.id, 'REJECT')}
                      className="px-3 py-1.5 rounded-md border border-error text-error font-label text-xs font-semibold hover:bg-error/10 flex items-center gap-1 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}

      {/* Stats & Sports Interests Grid (Lines 320-370) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Preferred Sports & Roles (5 columns) */}
        <div className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-title-lg font-bold">Preferred Sports &amp; Roles</h2>
            <span className="font-mono text-xs text-light-muted dark:text-dark-muted">
              {sports.length} active
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {sports.length === 0 ? (
              <div className="p-4 rounded-md border border-dashed border-light-border dark:border-dark-border text-xs font-body text-light-muted dark:text-dark-muted">
                No sports selected yet. Click <strong>Edit Profile</strong> to choose sports added by Admin.
              </div>
            ) : (
              sports.map((sp) => (
                <div
                  key={sp.id}
                  className="p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/60 dark:border-dark-border/60 flex items-center justify-between transition-colors hover:border-primary/40"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-headline text-title-md font-semibold">{sp.sport}</p>
                      {sp.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-label font-bold uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
                      {sp.preferredPosition
                        ? `Position: ${sp.preferredPosition}`
                        : sp.preferredFormat
                          ? `Format: ${sp.preferredFormat}`
                          : 'General Squad Player'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label text-label-sm font-semibold shrink-0">
                    {sp.skillLevel}
                  </span>
                </div>
              ))
            )}
          </div>

          {profile?.weeklyAvailability && profile.weeklyAvailability.length > 0 && (
            <div className="pt-3 border-t border-light-border dark:border-dark-border flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold">
                Weekly Availability (BST)
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.weeklyAvailability.map((slot, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-xs text-light-muted dark:text-dark-muted"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Participation Statistics & History (7 columns) */}
        <div className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-5">
          <h2 className="font-headline text-title-lg font-bold">Participation Statistics &amp; History</h2>

          {/* 3 Metric Summary Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-2.5 sm:p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/40 dark:border-dark-border/40 text-center">
              <p className="font-headline text-lg sm:text-headline-md font-bold tabular-nums text-primary">
                {stats.matchesPlayed}
              </p>
              <p className="font-body text-[11px] sm:text-body-sm text-light-muted dark:text-dark-muted mt-1 leading-tight">
                Matches Played
              </p>
            </div>

            <div className="p-2.5 sm:p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/40 dark:border-dark-border/40 text-center">
              <p className="font-headline text-lg sm:text-headline-md font-bold tabular-nums">
                {stats.matchesOrganized}
              </p>
              <p className="font-body text-[11px] sm:text-body-sm text-light-muted dark:text-dark-muted mt-1 leading-tight">
                Organized
              </p>
            </div>

            <div className="p-2.5 sm:p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/40 dark:border-dark-border/40 text-center">
              <p className="font-headline text-lg sm:text-headline-md font-bold tabular-nums text-success">
                {stats.showUpRate}%
              </p>
              <p className="font-body text-[11px] sm:text-body-sm text-light-muted dark:text-dark-muted mt-1 leading-tight">
                Show-up Rate
              </p>
            </div>
          </div>

          {/* Ratings Received from Organizers */}
          {profile?.ratings && (
            <div className="p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-label font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faStar} className="text-warning" />
                  <span>Organizer Player Ratings</span>
                </span>
                <span className="font-headline font-bold text-warning tabular-nums">
                  {profile.ratings.playerRatingAvg
                    ? `${Number(profile.ratings.playerRatingAvg).toFixed(1)} / 5 (${profile.ratings.playerRatingCount})`
                    : 'No ratings yet'}
                </span>
              </div>
              {Array.isArray(profile.ratings.recent) &&
                profile.ratings.recent.filter((r) => r.contextRole === 'ORGANIZER_TO_PLAYER').length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-light-border/60 dark:border-dark-border/60">
                    {profile.ratings.recent
                      .filter((r) => r.contextRole === 'ORGANIZER_TO_PLAYER')
                      .slice(0, 3)
                      .map((r) => (
                        <div key={r.id} className="text-xs flex items-start justify-between gap-2">
                          <span className="text-light-muted dark:text-dark-muted">
                            <strong className="text-light-on-surface dark:text-dark-on-surface">{r.raterName}:</strong>{' '}
                            {r.comment || 'Great sportsmanship'}
                          </span>
                          <span className="font-mono font-bold text-warning shrink-0">{r.score}★</span>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          )}

          {/* Match History List */}
          <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border pt-1">
            <span className="font-label text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold pb-2">
              Recent Verified Sessions
            </span>
            {history.length === 0 ? (
              <p className="py-4 text-xs font-body text-light-muted dark:text-dark-muted">
                No match history recorded yet. Join a match from Explore!
              </p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated flex items-center justify-center text-primary text-xs shrink-0">
                      <FontAwesomeIcon icon={faCalendarCheck} />
                    </span>
                    <div>
                      <span className="font-headline text-body-md font-semibold block">
                        {item.title}
                      </span>
                      <span className="font-body text-xs text-light-muted dark:text-dark-muted">
                        {item.sport ? `${item.sport} • ` : ''}Role: {item.role || 'Player'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums block">
                      {typeof item.date === 'number' ? formatDateTimeDhaka(item.date) : item.date}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-label text-[10px] font-semibold ${
                        item.status === 'Did Not Show Up'
                          ? 'bg-error/15 text-error'
                          : 'bg-success/15 text-success'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {!isPublicView && <DeleteAccountCard />}
    </div>
  );
};

export default PlayerProfilePage;
