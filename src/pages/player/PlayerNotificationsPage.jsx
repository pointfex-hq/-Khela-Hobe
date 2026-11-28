import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheck,
  faCheckDouble,
  faTrashCan,
  faArrowRight,
  faFutbol,
  faFileLines,
  faShieldHalved,
  faCircle,
  faXmark,
  faSliders,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import { notificationService } from '../../services/endpoints/notificationService';
import { childService } from '../../services/endpoints/childService';
import { useNotifications } from '../../contexts/NotificationContext';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

export const PlayerNotificationsPage = () => {
  const { refreshNotifications } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [guardianRequests, setGuardianRequests] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    emailTournamentAlerts: true,
    emailTicketUpdates: true,
    emailMatchJoin: true,
    emailApplication: true,
    emailMatchUpdate: true,
    emailSafety: false,
    pushEnabled: false,
  });

  useEffect(() => {
    setPrefsLoading(true);
    notificationService
      .getPreferences()
      .then((res) => {
        if (res?.data) setPrefs((prev) => ({ ...prev, ...res.data }));
      })
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, []);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await notificationService.updatePreferences(prefs);
      if (res?.data) setPrefs((prev) => ({ ...prev, ...res.data }));
      toast.success(res.message || 'Notification preferences saved!');
    } catch (err) {
      toast.error(err?.message || 'Failed to save notification preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'matches', label: 'Matches' },
    { id: 'applications', label: 'Applications' },
    { id: 'safety', label: 'Safety & Trust' },
  ];

  const loadNotifications = async (targetPage = page) => {
    setLoading(true);
    try {
      const [res, guardRes] = await Promise.all([
        notificationService.getNotifications(selectedCategory, {
          page: targetPage - 1,
          size: 12,
        }),
        childService.getIncomingRequests().catch(() => ({ data: [] })),
      ]);
      setNotifications(res.data || []);
      setTotalPages(res.totalPages || 1);
      setUnreadCount(res.unreadCount || 0);
      setGuardianRequests(guardRes?.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondGuardian = async (requestId, action) => {
    setRespondingId(requestId);
    try {
      const res = await childService.respondToRequest(requestId, action);
      toast.success(res.message);
      await Promise.all([loadNotifications(), refreshNotifications()]);
    } catch (err) {
      toast.error(err?.message || 'Failed to update guardian link request');
    } finally {
      setRespondingId(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    loadNotifications(page);
  }, [selectedCategory, page]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      await Promise.all([loadNotifications(), refreshNotifications()]);
      toast.success('Notification marked as read');
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await Promise.all([loadNotifications(), refreshNotifications()]);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      loadNotifications();
      toast.success('Notification removed');
    } catch {
      toast.error('Failed to remove notification');
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'matches':
        return faFutbol;
      case 'applications':
        return faFileLines;
      case 'safety':
        return faShieldHalved;
      default:
        return faBell;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header Block (Reference lines 241-250 in UIUX/notifications/code.html) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-headline-lg font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-label text-xs font-bold tabular-nums">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={showPrefs ? 'primary' : 'outline'}
            size="sm"
            icon={faSliders}
            onClick={() => setShowPrefs((v) => !v)}
          >
            {showPrefs ? 'Hide Preferences' : 'Email Preferences'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="tertiary"
              size="sm"
              icon={faCheckDouble}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Email & Notification Preferences Panel */}
      {showPrefs && (
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-primary/50 p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-light-border dark:border-dark-border">
            <div className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faEnvelope} className="text-primary" />
              <div>
                <h2 className="font-headline text-base font-bold">
                  Email &amp; Alert Notification Preferences
                </h2>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                  Choose which automated email notifications you receive. Security OTPs always deliver when requested.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={savingPrefs}
              disabled={prefsLoading}
              onClick={handleSavePreferences}
              className="self-start sm:self-auto"
            >
              Save Preferences
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              {
                key: 'emailTournamentAlerts',
                title: 'Area Match & Tournament Alerts',
                desc: 'Get emailed when a new match or approved tournament opens in your area.',
              },
              {
                key: 'emailTicketUpdates',
                title: 'Ticket Purchases & Gate Check-In',
                desc: 'Confirmation emails with ticket codes, QR pass links, and gate check-in receipts.',
              },
              {
                key: 'emailMatchJoin',
                title: 'Match Spots & Squad Registrations',
                desc: 'Confirmation when you join a match, pay online, or register a tournament squad.',
              },
              {
                key: 'emailApplication',
                title: 'Application Review Decisions',
                desc: 'Instant email when an organizer approves or declines your match application.',
              },
              {
                key: 'emailMatchUpdate',
                title: 'Schedule & Result Updates',
                desc: 'Notifications for match updates, venue changes, and tournament results.',
              },
              {
                key: 'emailSafety',
                title: 'Safety & Guardian Link Alerts',
                desc: 'Receive email alerts whenever a guardian initiates or updates a Safety ID link.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="p-3 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-start justify-between gap-3 cursor-pointer"
              >
                <div>
                  <span className="font-label font-semibold text-light-on-surface dark:text-dark-on-surface block">
                    {item.title}
                  </span>
                  <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
                    {item.desc}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(prefs[item.key])}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="mt-0.5 rounded accent-primary w-4 h-4 shrink-0"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {/* Category Pills (Reference lines 253-257) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full font-label text-sm font-semibold transition-all duration-state-change whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface hover:border-primary'
              }`}
            >
              {cat.label} {cat.id === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          );
        })}
      </div>

      {/* Pending Guardian Safety Link Requests Panel */}
      {guardianRequests.filter((r) => r.status !== 'VERIFIED').length > 0 && (
        <section className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-secondary/50 p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="text-secondary text-lg" />
            <h2 className="font-headline text-title-md font-bold">
              Pending Guardian Link Requests
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {guardianRequests
              .filter((r) => r.status !== 'VERIFIED')
              .map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-headline text-sm font-bold">
                      {req.guardianName} ({req.relationship})
                    </p>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                      {req.guardianEmail || req.guardianPhone || 'Requested access via your Safety ID'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={respondingId === req.id}
                      onClick={() => handleRespondGuardian(req.id, 'ACCEPT')}
                      className="px-3.5 py-1.5 rounded-md bg-success text-on-success font-label text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === req.id}
                      onClick={() => handleRespondGuardian(req.id, 'REJECT')}
                      className="px-3.5 py-1.5 rounded-md border border-error text-error font-label text-xs font-semibold hover:bg-error/10 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Notifications Stream */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="p-12 text-center text-light-muted dark:text-dark-muted font-body">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col items-center gap-3">
            <FontAwesomeIcon icon={faBell} className="text-3xl text-light-muted dark:text-dark-muted" />
            <h3 className="font-headline text-lg font-bold">No notifications here</h3>
            <p className="font-body text-sm text-light-muted dark:text-dark-muted">
              You are all caught up! Match activity and schedule alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <article
              key={notif.id}
              className={`rounded-lg p-4 sm:p-5 flex items-start justify-between gap-3 sm:gap-4 transition-colors duration-state-change shadow-sm ${
                notif.read
                  ? 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border'
                  : 'bg-light-surface dark:bg-dark-surface border-2 border-primary'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <span
                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.read
                      ? 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted'
                      : 'bg-primary text-on-primary font-bold'
                  }`}
                >
                  <FontAwesomeIcon icon={getCategoryIcon(notif.category)} className="text-sm" />
                </span>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-base font-bold text-light-on-surface dark:text-dark-on-surface">
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="Unread" />
                    )}
                  </div>

                  <p className="font-body text-sm text-light-muted dark:text-dark-muted">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <span className="font-mono text-light-muted dark:text-dark-muted">
                      {notif.time}
                    </span>
                    {notif.actionUrl && (
                      <Link
                        to={notif.actionUrl === '/notifications' ? ROUTES.PLAYER_PROFILE : notif.actionUrl}
                        className="font-label font-semibold text-secondary dark:text-primary hover:underline flex items-center gap-1"
                      >
                        <span>View</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="Mark as read"
                    aria-label="Mark as read"
                    className="w-8 h-8 rounded-md flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-primary hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated transition-colors"
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notif.id)}
                  title="Remove notification"
                  aria-label="Remove notification"
                  className="w-8 h-8 rounded-md flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-error hover:bg-error/10 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="pt-2"
        />
      )}
    </div>
  );
};

export default PlayerNotificationsPage;
