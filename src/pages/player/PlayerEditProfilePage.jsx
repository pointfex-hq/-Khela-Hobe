import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faPlus,
  faXmark,
  faCircleCheck,
  faArrowLeft,
  faFloppyDisk,
  faTrashCan,
  faShieldHalved,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { profileService } from '../../services/endpoints/profileService';
import { toastService } from '../../components/feedback/toastService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { ROUTES } from '../../constants/routes';

export const PlayerEditProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState('');

  // Sports list state
  const [sportsList, setSportsList] = useState([]);

  // Weekly availability
  const [availability, setAvailability] = useState([]);

  // Privacy toggles
  const [privacy, setPrivacy] = useState({
    showGeneralAreaOnly: true,
    hidePhoneUntilAccepted: true,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      area: 'Banani / Gulshan, Dhaka North',
      bio: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await profileService.getPlayerProfile();
        if (res?.data) {
          const d = res.data;
          reset({
            name: d.name || '',
            area: d.area || 'Banani / Gulshan, Dhaka North',
            bio: d.bio || '',
          });
          setAvatarUrl(
            d.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          );
          setSportsList(d.sportsPreferences || []);
          setAvailability(d.weeklyAvailability || [
            'Weekdays 6:00 PM – 10:00 PM',
            'Friday Morning (7:00 AM – 11:00 AM)',
          ]);
          setPrivacy(d.privacy || {
            showGeneralAreaOnly: true,
            hidePhoneUntilAccepted: true,
          });
        }
      } catch {
        toastService.error('Failed to load profile for editing.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  // Handle Photo Change
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastService.error('Image exceeds 2 MB limit. Please select a smaller photo.');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await profileService.uploadProfileImage(file);
      if (res?.url) {
        setAvatarUrl(res.url);
        toastService.success('Profile photo updated!');
      }
    } catch {
      toastService.error('Failed to upload profile picture.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    toastService.info('Reset avatar to default placeholder.');
  };

  // Add Sport
  const handleAddSport = () => {
    const newSport = {
      id: `sp_${Date.now()}`,
      sport: 'Basketball 3x3',
      skillLevel: 'Intermediate',
      preferredPosition: 'Point Guard',
      isPrimary: false,
    };
    setSportsList((prev) => [...prev, newSport]);
    toastService.success('Added new sport category.');
  };

  // Remove Sport
  const handleRemoveSport = (id) => {
    setSportsList((prev) => prev.filter((s) => s.id !== id));
  };

  // Update Sport Item
  const handleSportChange = (id, field, value) => {
    setSportsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Toggle Availability Option
  const toggleAvailability = (opt) => {
    setAvailability((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
    );
  };

  // Save changes
  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        avatar: avatarUrl,
        sportsPreferences: sportsList,
        weeklyAvailability: availability,
        privacy,
      };

      const res = await profileService.updatePlayerProfile(payload);
      if (res?.success) {
        setShowSuccessBanner(true);
        toastService.success('Profile preferences successfully saved!');
        setTimeout(() => {
          navigate(ROUTES.PLAYER_PROFILE);
        }, 800);
      }
    } catch {
      toastService.error('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading profile settings..." />
      </div>
    );
  }

  const availabilityOptions = [
    'Weekdays 6:00 PM – 10:00 PM',
    'Friday Morning (7:00 AM – 11:00 AM)',
    'Saturday Afternoon',
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-4 pb-2 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.PLAYER_PROFILE}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary text-light-muted dark:text-dark-muted transition-colors"
            aria-label="Back to Profile"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Link>
          <div>
            <h1 className="font-headline text-title-lg font-bold">Edit Athlete Profile</h1>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Update personal info, sports preferences, and visibility
            </p>
          </div>
        </div>
      </header>

      {/* Success Notification Banner (Reference line 260) */}
      {showSuccessBanner && (
        <div className="p-4 rounded-md bg-success/15 border border-success text-success flex items-center gap-3 animate-fade-in">
          <FontAwesomeIcon icon={faCircleCheck} className="text-lg" />
          <span className="font-label text-label-md font-semibold">
            Profile changes successfully saved!
          </span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Section 1: Basic Information (Lines 266-309) */}
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5">
          <h2 className="font-headline text-title-lg font-bold">Basic Information</h2>

          {/* Avatar Photo Row */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary ring-4 ring-primary/10"
              />
              {uploadingImage && (
                <div className="absolute inset-0 bg-dark-background/60 rounded-full flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
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
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCamera} className="text-primary text-sm" />
                  <span>Change Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="shrink-0 px-3 py-2 rounded-md text-error font-label text-label-md hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
                >
                  Remove
                </button>
              </div>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                JPG or PNG up to 2 MB. Clear face photos help teammates recognize you at the turf.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">Full Name</span>
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                placeholder="Tanvir Hasan"
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
              {errors.name && <span className="text-error text-xs">{errors.name.message}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-semibold">General Area (Public)</span>
              <select
                {...register('area')}
                className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="Banani / Gulshan, Dhaka North">Banani / Gulshan, Dhaka North</option>
                <option value="Mirpur, Dhaka North">Mirpur, Dhaka North</option>
                <option value="Uttara, Dhaka North">Uttara, Dhaka North</option>
                <option value="Dhanmondi, Dhaka South">Dhanmondi, Dhaka South</option>
                <option value="Gazipur Sadar">Gazipur Sadar</option>
                <option value="Chattogram Metro">Chattogram Metro</option>
              </select>
              <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                Only your general neighborhood is shown—never your street address.
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-semibold">Player Bio</span>
            <textarea
              rows={3}
              {...register('bio')}
              placeholder="Share your playing style, frequency, preferred days, or turf preferences..."
              className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none"
            />
          </label>
        </section>

        {/* Section 2: Sports, Positions & Skill Levels (Lines 312-386) */}
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-title-lg font-bold">Sports, Positions &amp; Skill Levels</h2>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                Helps organizers balance teams and match you to the right lobbies.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSport}
              className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-primary text-xs" />
              <span>Add Sport</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sportsList.map((sp) => (
              <div
                key={sp.id}
                className="rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border p-4 flex flex-col gap-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline text-title-md font-semibold truncate">
                    {sp.sport}
                  </span>
                  {sp.isPrimary ? (
                    <span className="px-2 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-primary font-label text-label-sm font-semibold">
                      Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveSport(sp.id)}
                      className="text-light-muted dark:text-dark-muted hover:text-error transition-colors p-1"
                      aria-label={`Remove ${sp.sport}`}
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                  )}
                </div>

                <label className="flex flex-col gap-1">
                  <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
                    Skill Level
                  </span>
                  <select
                    value={sp.skillLevel}
                    onChange={(e) => handleSportChange(sp.id, 'skillLevel', e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-body-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Recreational">Recreational</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Competitive">Competitive</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
                    {sp.sport.toLowerCase().includes('badminton') ? 'Preferred Format' : 'Preferred Position / Role'}
                  </span>
                  <input
                    type="text"
                    value={sp.preferredPosition || sp.preferredFormat || ''}
                    onChange={(e) =>
                      handleSportChange(
                        sp.id,
                        sp.sport.toLowerCase().includes('badminton') ? 'preferredFormat' : 'preferredPosition',
                        e.target.value
                      )
                    }
                    placeholder="e.g. Midfielder, Doubles"
                    className="w-full px-3 py-2 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-body text-body-sm focus:border-primary focus:outline-none"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Availability & Privacy (Lines 388-427) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Availability */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg font-bold">Weekly Availability (BST)</h2>
            <div className="flex flex-wrap gap-2.5">
              {availabilityOptions.map((opt) => {
                const isSelected = availability.includes(opt);
                return (
                  <label
                    key={opt}
                    onClick={() => toggleAvailability(opt)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-light-surface-elevated dark:bg-dark-surface-elevated border-primary text-light-on-surface dark:text-dark-on-surface font-semibold'
                        : 'bg-light-background dark:bg-dark-background border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-primary focus:ring-primary pointer-events-none"
                    />
                    <span className="font-label text-label-md">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Privacy & Visibility */}
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg font-bold">Privacy &amp; Visibility</h2>
            <div className="flex flex-col gap-3">
              <label
                onClick={() =>
                  setPrivacy((p) => ({ ...p, showGeneralAreaOnly: !p.showGeneralAreaOnly }))
                }
                className="flex items-start justify-between gap-4 cursor-pointer p-2 rounded hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
              >
                <div>
                  <p className="font-label text-label-md font-semibold">Show general area only</p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                    Display district/thana on your public player card.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showGeneralAreaOnly}
                  readOnly
                  className="mt-1 rounded text-primary focus:ring-primary pointer-events-none"
                />
              </label>

              <label
                onClick={() =>
                  setPrivacy((p) => ({ ...p, hidePhoneUntilAccepted: !p.hidePhoneUntilAccepted }))
                }
                className="flex items-start justify-between gap-4 cursor-pointer p-2 rounded hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
              >
                <div>
                  <p className="font-label text-label-md font-semibold">
                    Hide phone number until match accepted
                  </p>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                    Only confirmed match organizers can see your contact.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.hidePhoneUntilAccepted}
                  readOnly
                  className="mt-1 rounded text-primary focus:ring-primary pointer-events-none"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Action Buttons (Lines 429-436) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={ROUTES.PLAYER_PROFILE}
            className="shrink-0 px-5 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-label text-label-lg hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary text-on-primary font-label text-label-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-sm" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerEditProfilePage;
