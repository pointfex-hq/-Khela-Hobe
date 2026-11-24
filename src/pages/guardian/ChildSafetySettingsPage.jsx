import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faBell,
  faEye,
  faLock,
  faCheck,
  faSliders,
  faUsers,
  faClock,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { safetyService } from '../../services/endpoints/safetyService';
import { childService } from '../../services/endpoints/childService';
import { ROUTES } from '../../constants/routes';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const ChildSafetySettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [child, setChild] = useState({ name: 'Ayan Rahman', age: 15, id: 'ch_ayan_15' });

  // Settings form state
  const [settings, setSettings] = useState({
    matchJoinAlerts: true,
    venueCheckInAlerts: true,
    eveningCurfewAlerts: true,
    publicVenueVisibility: true,
    hidePrivateChatAndCoordinates: true, // enforced platform policy
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const childrenRes = await childService.getLinkedChildren();
        const firstChild = (childrenRes.data || []).find(
          (c) => c.status === 'Authorized' || c.isVerified
        ) || { name: 'Ayan Rahman', age: 15, id: 'ch_ayan_15' };

        if (!isMounted) return;
        setChild(firstChild);

        const settingsRes = await safetyService.getChildSafetySettings(firstChild.id);
        if (isMounted && settingsRes.success) {
          setSettings((prev) => ({
            ...prev,
            ...settingsRes.data,
            hidePrivateChatAndCoordinates: true, // always keep enforced
          }));
        }
      } catch (err) {
        console.error('Failed to load child safety settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (key) => {
    if (key === 'hidePrivateChatAndCoordinates') return; // Enforced policy
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSavedSuccess(false);
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await safetyService.updateChildSafetySettings(child.id, settings);
      if (res.success) {
        setSavedSuccess(true);
        toastService.success('Safety preferences saved successfully.');
      }
    } catch {
      toastService.error('Failed to save safety settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading child safety configuration..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
              Child Safety Settings
            </h1>
            <Badge variant="success" size="sm" hasDot>
              Child: {child.name} (Authorized)
            </Badge>
          </div>
          <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
            Configure alert preferences, activity visibility, and guardian access permissions.
          </p>
        </div>

        {savedSuccess && (
          <span className="px-3 py-1.5 rounded-md bg-success/10 border border-success text-success font-label text-xs sm:text-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto">
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            <span>Settings saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSavePreferences} className="flex flex-col gap-6">
        {/* Section 1: Notification Preferences */}
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="text-primary text-sm" />
            <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
              Notification Preferences
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Match Join Alerts */}
            <label className="flex items-start justify-between gap-4 cursor-pointer select-none group">
              <div>
                <p className="font-label font-semibold text-sm text-light-on-surface dark:text-dark-on-surface group-hover:text-primary transition-colors">
                  Match Join &amp; Application Alerts
                </p>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Notify when {child.name} joins a Quick Match or applies to an Approval Required roster.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.matchJoinAlerts}
                onChange={() => handleToggle('matchJoinAlerts')}
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background cursor-pointer"
              />
            </label>

            {/* Check-In Alerts */}
            <label className="flex items-start justify-between gap-4 cursor-pointer select-none group">
              <div>
                <p className="font-label font-semibold text-sm text-light-on-surface dark:text-dark-on-surface group-hover:text-primary transition-colors">
                  Venue Check-In &amp; Schedule Changes
                </p>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Alert when an organizer updates start time (BST) or public turf location.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.venueCheckInAlerts}
                onChange={() => handleToggle('venueCheckInAlerts')}
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background cursor-pointer"
              />
            </label>

            {/* Evening Curfew Alerts */}
            <label className="flex items-start justify-between gap-4 cursor-pointer select-none group">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-label font-semibold text-sm text-light-on-surface dark:text-dark-on-surface group-hover:text-primary transition-colors">
                    Evening Curfew Notice (After 8:30 PM BST)
                  </p>
                  <FontAwesomeIcon icon={faClock} className="text-warning text-xs" />
                </div>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Highlight matches scheduled to finish after 8:30 PM Bangladesh Standard Time.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.eveningCurfewAlerts}
                onChange={() => handleToggle('eveningCurfewAlerts')}
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Section 2: Activity Visibility & Guardian Permissions */}
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faEye} className="text-primary text-sm" />
            <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
              Activity Visibility &amp; Guardian Permissions
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Public Venue & Organizer Visibility */}
            <label className="flex items-start justify-between gap-4 cursor-pointer select-none group">
              <div>
                <p className="font-label font-semibold text-sm text-light-on-surface dark:text-dark-on-surface group-hover:text-primary transition-colors">
                  Public Venue &amp; Organizer Visibility
                </p>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  View verified turf name and organizer profile for upcoming matches.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.publicVenueVisibility}
                onChange={() => handleToggle('publicVenueVisibility')}
                className="mt-1 w-5 h-5 rounded text-primary focus:ring-primary border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background cursor-pointer"
              />
            </label>

            {/* Enforced Privacy Policy - Masked Coordinates */}
            <div className="p-4 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLock} className="text-primary text-xs" />
                  <p className="font-label font-semibold text-sm text-light-on-surface dark:text-dark-on-surface">
                    Hide Private Player Chat &amp; Residential Coordinates
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-label text-[10px] font-bold">
                    Enforced Policy
                  </span>
                </div>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Enforced by platform privacy policy—exact home coordinates and private chats are never exposed or logged.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="mt-1 w-5 h-5 rounded text-primary bg-primary/20 border-primary cursor-not-allowed opacity-80"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Verification Status */}
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                Linking &amp; Verification Status
              </h2>
              <Badge variant="success" size="sm" hasDot>
                Authorized
              </Badge>
            </div>
            <p className="font-body text-xs text-light-muted dark:text-dark-muted">
              Verified by child consent and backend authorization on 12 Oct 2026.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={faUsers}
            onClick={() => navigate(ROUTES.GUARDIAN_CHILDREN)}
          >
            Manage Links
          </Button>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={faArrowLeft}
            onClick={() => navigate(ROUTES.GUARDIAN_DASHBOARD)}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            icon={faCheck}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChildSafetySettingsPage;
