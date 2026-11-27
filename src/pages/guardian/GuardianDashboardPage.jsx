import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faLock,
  faUsers,
  faClock,
  faTriangleExclamation,
  faChevronRight,
  faPlus,
  faArrowRight,
  faCalendarCheck,
  faSliders,
  faLocationDot,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { guardianService } from '../../services/endpoints/guardianService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const GuardianDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await guardianService.getGuardianDashboard();
        if (isMounted && res.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load guardian dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading guardian safety overview..." />
      </div>
    );
  }

  const { metrics, authorizedChildren = [], pendingRequests = [], recentAlerts = [], privacyNotice } =
    dashboardData || {};

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12">
      {/* Top Header Row with Parity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FontAwesomeIcon icon={faShieldHalved} className="text-lg" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline font-bold text-xl sm:text-2xl text-light-on-background dark:text-dark-on-background">
                Guardian &amp; Child Safety
              </h1>
              <Badge variant="success" size="sm" hasDot>
                Verified Relationship
              </Badge>
            </div>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              {user?.name || 'Nusrat Jahan'} • Uttara Sector 7, Dhaka
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={faPlus}
            onClick={() => navigate(ROUTES.GUARDIAN_CHILDREN)}
          >
            Link Child via Safety ID
          </Button>
        </div>
      </div>

      {/* Platform Privacy Notice */}
      <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex items-start sm:items-center gap-3 shadow-sm">
        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faLock} className="text-sm" />
        </span>
        <p className="font-body text-sm text-light-muted dark:text-dark-muted">
          {privacyNotice ||
            'Only verified guardian relationships can view linked child activity. A Safety ID initiates linking and is never an authorization credential on its own.'}
        </p>
      </div>

      {/* 3 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Linked Children */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              Linked Children
            </span>
            <FontAwesomeIcon icon={faUsers} className="text-primary text-sm" />
          </div>
          <span className="font-headline font-bold text-2xl sm:text-3xl text-light-on-surface dark:text-dark-on-surface tabular-nums">
            {metrics?.linkedLabel || `${authorizedChildren.length} Verified`}
          </span>
          <span className="font-body text-xs text-success flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
            {metrics?.linkedSubtext || 'All safety permissions active'}
          </span>
        </div>

        {/* Pending Requests */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              Pending Linking Requests
            </span>
            <FontAwesomeIcon icon={faClock} className="text-warning text-sm" />
          </div>
          <span className="font-headline font-bold text-2xl sm:text-3xl text-warning tabular-nums">
            {metrics?.pendingCount || pendingRequests.length}
          </span>
          <span className="font-body text-xs text-light-muted dark:text-dark-muted">
            {metrics?.pendingSubtext || 'Awaiting child & backend verification'}
          </span>
        </div>

        {/* Unread Alerts */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              Unread Safety Alerts
            </span>
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-accent text-sm" />
          </div>
          <span className="font-headline font-bold text-2xl sm:text-3xl text-accent tabular-nums">
            {metrics?.unreadAlerts || 2}
          </span>
          <span className="font-body text-xs text-light-muted dark:text-dark-muted">
            {metrics?.unreadSubtext || 'Protected previews enabled'}
          </span>
        </div>
      </section>

      {/* Main Grid: Authorized Child Accounts & Recent Safety Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Authorized Child Accounts (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-lg sm:text-xl text-light-on-surface dark:text-dark-on-surface">
                Authorized Child Accounts
              </h2>
              <Link
                to={ROUTES.GUARDIAN_CHILDREN}
                className="font-label text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span>Manage Links</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {authorizedChildren.map((child) => (
                <div
                  key={child.id}
                  className="p-4 sm:p-5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-title font-bold text-base text-light-on-surface dark:text-dark-on-surface">
                        {child.name} {child.age ? `(Age ${child.age})` : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-success text-on-success font-label text-xs font-semibold">
                        {child.status || 'Verified'}
                      </span>
                    </div>

                    {child.nextActivity ? (
                      <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
                        Next authorized activity:{' '}
                        <strong className="text-light-on-surface dark:text-dark-on-surface">
                          {child.nextActivity.date} • {child.nextActivity.title}
                        </strong>
                      </p>
                    ) : (
                      <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                        {child.area || 'Uttara Sector 7, Dhaka'} • Sports:{' '}
                        {child.sports?.join(', ') || 'Football'}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      <FontAwesomeIcon icon={faLocationDot} className="text-[11px] text-primary" />
                      <span>{child.nextActivity?.venue || 'Uttara Sector 7 Field (Approximate)'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={faCalendarCheck}
                      onClick={() => navigate(`/guardian/children/${child.id}/activity`)}
                    >
                      View Activity
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      icon={faSliders}
                      onClick={() => navigate(ROUTES.GUARDIAN_SAFETY)}
                    >
                      Settings
                    </Button>
                  </div>
                </div>
              ))}

              {authorizedChildren.length === 0 && (
                <div className="p-8 text-center border border-dashed border-light-border dark:border-dark-border rounded-lg">
                  <p className="font-body text-sm text-light-muted dark:text-dark-muted">
                    No authorized child accounts linked yet.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(ROUTES.GUARDIAN_CHILDREN)}
                  >
                    Link Child via Safety ID
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Linking Banner */}
          <div className="rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-headline font-bold text-sm text-light-on-surface dark:text-dark-on-surface">
                Link Another Child Account
              </p>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                Safety ID initiates request only—requires child approval and verification.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={faArrowRight}
              onClick={() => navigate(ROUTES.GUARDIAN_CHILDREN)}
            >
              Start Request
            </Button>
          </div>
        </div>

        {/* Right Col: Recent Safety Alerts (5 cols) */}
        <div className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg sm:text-xl text-light-on-surface dark:text-dark-on-surface">
              Recent Safety Alerts
            </h2>
            <Link
              to={ROUTES.GUARDIAN_ALERTS}
              className="font-label text-xs sm:text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(ROUTES.GUARDIAN_ALERTS)}
                className="py-3.5 flex flex-col gap-1 cursor-pointer group transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {alert.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    )}
                    <span
                      className={`font-label text-xs font-semibold ${
                        alert.severity === 'warning'
                          ? 'text-warning'
                          : alert.unread
                          ? 'text-primary'
                          : 'text-light-on-surface dark:text-dark-on-surface'
                      }`}
                    >
                      {alert.title}
                    </span>
                  </div>
                  <span className="font-body text-xs text-light-muted dark:text-dark-muted tabular-nums shrink-0">
                    {alert.timestamp}
                  </span>
                </div>

                <p className="font-body text-xs text-light-muted dark:text-dark-muted line-clamp-2">
                  {alert.description}
                </p>

                <div className="flex items-center justify-between mt-1 text-[11px] text-light-muted dark:text-dark-muted">
                  <span>{alert.categoryLabel || `Child: ${alert.childName || 'Ayan Rahman'}`}</span>
                  <span className="group-hover:text-primary transition-colors flex items-center gap-1 font-label">
                    <span>Review</span>
                    <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
                  </span>
                </div>
              </div>
            ))}

            {recentAlerts.length === 0 && (
              <div className="py-8 text-center text-light-muted dark:text-dark-muted font-body text-xs">
                No recent safety alerts at this time.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuardianDashboardPage;
