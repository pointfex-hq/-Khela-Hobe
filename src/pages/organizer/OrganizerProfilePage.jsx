import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faLocationDot,
  faCalendarCheck,
  faTrophy,
  faStar,
  faUsers,
  faPenToSquare,
  faArrowLeft,
  faCamera,
  faBuilding,
  faFloppyDisk,
  faXmark,
  faEye,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { profileService } from '../../services/endpoints/profileService';
import Modal from '../../components/modals/Modal';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import GoogleAccountCard from '../../components/auth/GoogleAccountCard';
import DeleteAccountCard from '../../components/auth/DeleteAccountCard';
import { toastService } from '../../components/feedback/toastService';
import { ROUTES } from '../../constants/routes';

export const OrganizerProfilePage = () => {
  const { organizerId } = useParams();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await profileService.getOrganizerProfile(organizerId);
      if (res?.data) {
        setProfile(res.data);
        setAvatarUrl(res.data.avatar || '');
        reset({
          name: res.data.name || '',
          organization: res.data.organization || '',
          area: res.data.area || '',
          bio: res.data.bio || '',
          phone: res.data.phone || '',
        });
      }
    } catch {
      toastService.error('Failed to load organizer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [organizerId]);

  // Handle Image Upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastService.error('Image exceeds 2 MB limit.');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await profileService.uploadProfileImage(file);
      if (res?.url) {
        setAvatarUrl(res.url);
        toastService.success('Organizer photo updated!');
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit profile edit
  const onEditSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        fullName: formData.name,
        area: formData.area,
        bio: formData.bio,
        phoneNumber: formData.phone,
      };
      if (avatarUrl && !avatarUrl.startsWith('blob:')) {
        payload.profileImageUrl = avatarUrl;
      }
      const res = await profileService.updateOrganizerProfile(payload);
      if (res?.success) {
        setProfile((prev) => ({ ...(prev || {}), ...res.data }));
        setIsEditModalOpen(false);
        toastService.success('Organizer profile updated successfully!');
      }
    } catch (err) {
      toastService.error(err?.message || 'Failed to update organizer profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading organizer profile..." />
      </div>
    );
  }

  const stats = {
    matchesHosted: profile?.stats?.matchesOrganized ?? profile?.stats?.matchesHosted ?? 0,
    completionRate: profile?.stats?.showUpRate ?? profile?.stats?.completionRate ?? 100,
    playerRating: profile?.ratings?.organizerRatingAvg ?? profile?.stats?.playerRating ?? 0,
    ratingCount: profile?.ratings?.organizerRatingCount ?? 0,
  };

  const upcoming = profile?.upcomingMatches || [];
  const pastEvents = profile?.pastEvents || [];

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-8 pb-10">
      {/* Context Header */}
      <header className="flex items-center justify-between gap-4 pb-2 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.ORGANIZER_DASHBOARD}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted transition-colors"
            aria-label="Back to Organizer Console"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <h1 className="font-headline text-title-lg font-bold">Organizer Profile</h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Public profile, community trust rating, and hosted fixtures
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md font-medium hover:border-primary transition-colors"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-xs text-primary" />
          <span>Edit Profile</span>
        </button>
      </header>

      {/* Organizer Identity Card */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile?.name || 'Organizer'}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary ring-4 ring-primary/10 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/15 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-sm shrink-0 flex items-center justify-center font-headline text-2xl font-bold uppercase">
              {(profile?.name || profile?.email || 'O').charAt(0)}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-headline text-headline-lg font-bold tracking-tight">
                {profile?.name || 'Organizer'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm font-semibold">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                <span>Verified Organizer</span>
              </span>
            </div>

            <p className="font-body text-body-md text-light-muted dark:text-dark-muted flex flex-wrap items-center gap-1.5">
              <FontAwesomeIcon icon={faBuilding} className="text-secondary text-xs" />
              <span className="font-semibold text-light-on-surface dark:text-dark-on-surface">
                {profile?.organization || 'Community Match Organizer'}
              </span>
              <span>•</span>
              <FontAwesomeIcon icon={faLocationDot} className="text-primary text-xs" />
              <span>{profile?.area || profile?.city || 'Location not set'}</span>
            </p>

            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted max-w-2xl mt-1">
              {profile?.bio || 'No organizer bio added yet.'}
            </p>
          </div>
        </div>

        {/* 3 Metric Stat Counter */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-6 border-t md:border-t-0 md:border-l border-light-border dark:border-dark-border pt-4 md:pt-0 md:pl-6 shrink-0 text-center md:text-left">
          <div>
            <p className="font-headline text-headline-md font-bold tabular-nums text-primary">
              {stats.matchesHosted}
            </p>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
              Matches Hosted
            </p>
          </div>
          <div>
            <p className="font-headline text-headline-md font-bold tabular-nums text-success">
              {stats.completionRate}%
            </p>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
              Completion
            </p>
          </div>
          <div>
            <p className="font-headline text-headline-md font-bold tabular-nums flex items-center justify-center md:justify-start gap-1">
              <span>{stats.playerRating > 0 ? Number(stats.playerRating).toFixed(1) : 'New'}</span>
              <FontAwesomeIcon icon={faStar} className="text-warning text-xs" />
            </p>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted mt-0.5">
              Player Rating ({stats.ratingCount})
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Hosted Matches & Events (Lines 160-189) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-headline-md font-bold">Upcoming Matches &amp; Events</h2>
          <Link
            to={ROUTES.CREATE_QUICK_MATCH}
            className="font-label text-label-md text-primary hover:underline font-semibold"
          >
            + Host New Match
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcoming.map((match) => (
            <article
              key={match.id}
              className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col justify-between gap-4 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                    {match.type}
                  </span>
                  <span className="font-body text-body-sm text-success tabular-nums font-medium">
                    {match.remainingSlots
                      ? `${match.remainingSlots} slots left`
                      : `${match.filledTeams || 18} / ${match.totalTeams || 24} teams`}
                  </span>
                </div>
                <h3 className="font-headline text-title-lg font-bold">{match.title}</h3>
                <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
                  {match.venue} • {match.date}
                  {match.filledSlots && ` • ${match.filledSlots} / ${match.totalSlots} players`}
                </p>
              </div>

              <div className="pt-2 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                <Link
                  to={ROUTES.MATCH_DETAILS.replace(':matchId', match.id)}
                  className="px-4 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity"
                >
                  View Match
                </Link>
                <Link
                  to={ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', match.id)}
                  className="font-label text-label-sm text-light-muted dark:text-dark-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Manage Console</span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Past Event History (Lines 191-210) */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
        <h2 className="font-headline text-title-lg font-bold">Recent Event &amp; Match History</h2>
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {pastEvents.map((evt) => (
            <div
              key={evt.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-headline text-label-lg font-semibold">{evt.title}</p>
                <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                  {evt.date} • {evt.attended}
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-success font-label text-label-sm font-semibold self-start sm:self-center">
                {evt.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Google Account Linking & Account Deletion (own profile) */}
      {!organizerId && <GoogleAccountCard />}
      {!organizerId && <DeleteAccountCard />}

      {/* Edit Organizer Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Organizer Profile"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
          {/* Avatar edit */}
          <div className="flex items-center gap-4 pb-2 border-b border-light-border dark:border-dark-border">
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-primary ring-2 ring-primary/20"
            />
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-3.5 py-1.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCamera} className="text-primary text-xs" />
                <span>{uploadingImage ? 'Uploading...' : 'Change Photo'}</span>
              </button>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-1">
                JPG or PNG up to 2 MB.
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm font-semibold">Organizer Name</span>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
            />
            {errors.name && <span className="text-error text-xs">{errors.name.message}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm font-semibold">Organization / Club</span>
            <input
              type="text"
              {...register('organization')}
              placeholder="e.g. North Dhaka Sports Collective"
              className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm font-semibold">Area / Base</span>
              <input
                type="text"
                {...register('area')}
                placeholder="e.g. Banani / Gulshan, Dhaka"
                className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm font-semibold">Official Phone</span>
              <input
                type="text"
                {...register('phone')}
                placeholder="+880 1711..."
                className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-label text-label-sm font-semibold">Organizer Bio</span>
            <textarea
              rows={3}
              {...register('bio')}
              placeholder="Tell players and teams about your leagues, turf venues, and match quality standards..."
              className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:outline-none resize-none"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="text-sm" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizerProfilePage;
