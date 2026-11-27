import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from '@fortawesome/free-solid-svg-icons';
import { profileService } from '../../services/endpoints/profileService';
import { ROUTES } from '../../constants/routes';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { toastService } from '../../components/feedback/toastService';

export const PlayerProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await profileService.getPlayerProfile();
        if (res?.data) {
          setProfile(res.data);
        }
      } catch {
        toastService.error('Failed to load player profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading athlete profile..." />
      </div>
    );
  }

  const sports = profile?.sportsPreferences || [];
  const stats = profile?.stats || {
    matchesPlayed: 19,
    matchesOrganized: 14,
    showUpRate: 100,
  };
  const history = profile?.matchHistory || [];

  return (
    <div className="flex flex-col gap-8 max-w-6xl w-full mx-auto">
      {/* Profile Header Card (Reference: UIUX/player_profile/code.html lines 303-318) */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <img
            src={
              profile?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={profile?.name || 'Tanvir Hasan'}
            className="w-20 h-20 rounded-full object-cover border-2 border-primary ring-4 ring-primary/10 shadow-sm shrink-0"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-headline text-headline-md font-bold tracking-tight">
                {profile?.name || 'Tanvir Hasan'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-label text-xs font-semibold">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                <span>Verified Athlete</span>
              </span>
            </div>

            <p className="font-body text-body-md text-light-muted dark:text-dark-muted flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="text-secondary text-xs" />
              <span>{profile?.area || 'Gazipur & Dhaka North'} • Evening Turf &amp; Court Regular</span>
            </p>

            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted max-w-prose mt-0.5">
              {profile?.bio ||
                'Midfielder in 7v7 football and intermediate doubles badminton player. Always happy to bring extra shuttlecocks.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <Link
            to={ROUTES.PLAYER_PROFILE_EDIT}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md font-medium hover:border-primary transition-colors"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="text-xs text-light-muted dark:text-dark-muted" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </section>

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
            {sports.map((sp) => (
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
                      : `Format: ${sp.preferredFormat || 'Casual Doubles'}`}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label text-label-sm font-semibold shrink-0">
                  {sp.skillLevel}
                </span>
              </div>
            ))}
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
        <div className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5">
          <h2 className="font-headline text-title-lg font-bold">Participation Statistics &amp; History</h2>

          {/* 3 Metric Summary Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/40 dark:border-dark-border/40 text-center">
              <p className="font-headline text-headline-md font-bold tabular-nums text-primary">
                {stats.matchesPlayed}
              </p>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-1">
                Matches Played
              </p>
            </div>

            <div className="p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/40 dark:border-dark-border/40 text-center">
              <p className="font-headline text-headline-md font-bold tabular-nums">
                {stats.matchesOrganized}
              </p>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-1">
                Organized
              </p>
            </div>

            <div className="p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border/40 dark:border-dark-border/40 text-center">
              <p className="font-headline text-headline-md font-bold tabular-nums text-success">
                {stats.showUpRate}%
              </p>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-1">
                Show-up Rate
              </p>
            </div>
          </div>

          {/* Match History List */}
          <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border pt-1">
            <span className="font-label text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold pb-2">
              Recent Verified Sessions
            </span>
            {history.map((item) => (
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
                      Role: {item.role || 'Player'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums block">
                    {item.date}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-label text-[10px] font-semibold">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlayerProfilePage;
