import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheckDouble,
  faTriangleExclamation,
  faClock,
  faShieldHalved,
  faCheck,
  faLocationDot,
  faCalendarCheck,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { safetyService } from '../../services/endpoints/safetyService';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const SafetyAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Alerts' },
    { id: 'curfew', label: 'Curfew Notices' },
    { id: 'participation', label: 'Participation' },
    { id: 'schedule', label: 'Schedule Changes' },
    { id: 'checkin', label: 'Venue Check-Ins' },
  ];

  const fetchAlerts = async (cat = activeCategory) => {
    try {
      setLoading(true);
      const res = await safetyService.getSafetyAlerts(cat);
      if (res.success) {
        setAlerts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load safety alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(activeCategory);
  }, [activeCategory]);

  const handleMarkAllRead = async () => {
    try {
      const res = await safetyService.markAllAlertsAsRead();
      if (res.success) {
        toastService.success('All safety alerts marked as read.');
        fetchAlerts(activeCategory);
      }
    } catch {
      toastService.error('Failed to mark alerts as read.');
    }
  };

  const handleMarkSingleRead = async (alertId) => {
    try {
      const res = await safetyService.markAlertAsRead(alertId);
      if (res.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, unread: false } : a))
        );
      }
    } catch {
      // Ignore
    }
  };

  const unreadCount = alerts.filter((a) => a.unread).length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
              Safety Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge variant="warning" size="sm" hasDot>
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
            Real-time curfew, match participation, and venue check-in notices for your linked athletes.
          </p>
        </div>

        <Button
          variant="tertiary"
          size="md"
          icon={faCheckDouble}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-2 rounded-full font-label text-xs sm:text-sm whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Alerts Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" text="Loading safety alerts..." />
        </div>
      ) : alerts.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {alerts.map((alert) => {
            const isCurfew = alert.category === 'curfew';
            const isUnread = alert.unread;

            return (
              <article
                key={alert.id}
                onClick={() => isUnread && handleMarkSingleRead(alert.id)}
                className={`rounded-lg bg-light-surface dark:bg-dark-surface border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-150 cursor-pointer ${
                  isCurfew
                    ? 'border-warning/80 bg-warning/[0.02]'
                    : isUnread
                    ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                    : 'border-light-border dark:border-dark-border'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isCurfew
                        ? 'bg-warning/15 text-warning'
                        : isUnread
                        ? 'bg-primary/20 text-primary'
                        : 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={
                        isCurfew
                          ? faClock
                          : alert.category === 'checkin'
                          ? faLocationDot
                          : alert.category === 'schedule'
                          ? faCalendarCheck
                          : faShieldHalved
                      }
                      className="text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread ? (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label text-xs font-semibold">
                          Unread
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted font-label text-xs">
                          Read
                        </span>
                      )}
                      <span className="font-label text-xs text-light-muted dark:text-dark-muted">
                        {alert.categoryLabel || `Notice • ${alert.childName || 'Athlete'}`}
                      </span>
                    </div>

                    <h2 className="font-headline font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                      {alert.title}
                    </h2>

                    <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-light-border dark:border-dark-border">
                  <span className="font-mono text-xs text-light-muted dark:text-dark-muted tabular-nums">
                    {alert.timestamp}
                  </span>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkSingleRead(alert.id);
                      }}
                      className="text-xs font-label text-primary hover:underline flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={faBell}
          title="No alerts in this category"
          description="You are all caught up! No recent curfew or activity alerts found for this filter."
          actionText="Show All Alerts"
          onAction={() => setActiveCategory('all')}
        />
      )}
    </div>
  );
};

export default SafetyAlertsPage;
