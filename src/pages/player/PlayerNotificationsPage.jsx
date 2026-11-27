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
} from '@fortawesome/free-solid-svg-icons';
import { notificationService } from '../../services/endpoints/notificationService';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export const PlayerNotificationsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'matches', label: 'Matches' },
    { id: 'applications', label: 'Applications' },
    { id: 'safety', label: 'Safety & Trust' },
  ];

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(selectedCategory);
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [selectedCategory]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
      toast.success('Notification marked as read');
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
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

        {unreadCount > 0 && (
          <Button
            variant="tertiary"
            size="sm"
            icon={faCheckDouble}
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto"
          >
            Mark All Read
          </Button>
        )}
      </div>

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
              className={`rounded-lg p-5 flex items-start justify-between gap-4 transition-colors duration-state-change shadow-sm ${
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
                        to={notif.actionUrl}
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
    </div>
  );
};

export default PlayerNotificationsPage;
