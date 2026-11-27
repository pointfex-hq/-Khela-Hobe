import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCalendarCheck,
  faUsers,
  faClock,
  faClipboardList,
  faLocationDot,
  faChartSimple,
  faCircleCheck,
  faSliders,
  faBuilding,
  faArrowRight,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { organizerService } from '../../services/endpoints/organizerService';
import { analyticsService } from '../../services/endpoints/analyticsService';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { ROUTES } from '../../constants/routes';

export const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dashRes, analRes] = await Promise.all([
          organizerService.getOrganizerDashboard(user?.id),
          analyticsService.getOrganizerAnalytics(),
        ]);
        if (dashRes?.data) {
          setDashboardData(dashRes.data);
        }
        if (analRes?.data) {
          setAnalytics(analRes.data);
        }
      } catch (err) {
        console.error('Failed to load organizer dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" message="Loading Organizer Hub..." />
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    totalCreated: 0,
    upcoming: 0,
    active: 0,
    completed: 0,
    participants: 0,
    pendingApps: 0,
  };

  const activeMatches = dashboardData?.activeMatches || [];
  const pendingAlert = dashboardData?.pendingAlert ?? {
    count: 0,
    matchTitle: 'your active matches',
    schedule: 'Upcoming',
    remainingSlots: 0,
  };

  const attendanceData = analytics?.attendanceTrend || [];

  return (
    <div className="flex flex-col gap-8 max-w-7xl w-full mx-auto">
      {/* Header & Quick Create (Reference: UIUX/organizer_dashboard/code.html lines 303-312) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-headline-lg font-bold tracking-tight">
            Organizer Dashboard
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted mt-1">
            Track your Quick Matches, participant capacity, and pending join requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={ROUTES.CREATE_QUICK_MATCH}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <span>Create Quick Match</span>
          </Link>
          <Link
            to={ROUTES.ORGANIZER_EVENTS}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-label-md hover:border-primary transition-colors"
          >
            <FontAwesomeIcon icon={faTrophy} className="text-accent text-sm" />
            <span>Events Console</span>
          </Link>
          <Link
            to={ROUTES.ORGANIZER_EARNINGS}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface font-label text-label-md hover:border-primary transition-colors"
          >
            <FontAwesomeIcon icon={faChartSimple} className="text-success text-sm" />
            <span>Earnings &amp; Payouts</span>
          </Link>
        </div>
      </div>

      {/* Summary Metric Cards (6 metrics, lines 315-340) */}
      <section aria-label="Organizer statistics" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 transition-colors hover:border-primary/50">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Total Created
          </span>
          <span className="font-headline text-headline-md font-bold tabular-nums">
            {metrics.totalCreated}
          </span>
        </article>

        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 transition-colors hover:border-primary/50">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Upcoming
          </span>
          <span className="font-headline text-headline-md font-bold tabular-nums text-primary">
            {metrics.upcoming}
          </span>
        </article>

        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 transition-colors hover:border-primary/50">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Active
          </span>
          <span className="font-headline text-headline-md font-bold tabular-nums text-success">
            {metrics.active}
          </span>
        </article>

        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 transition-colors hover:border-primary/50">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Completed
          </span>
          <span className="font-headline text-headline-md font-bold tabular-nums">
            {metrics.completed}
          </span>
        </article>

        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 transition-colors hover:border-primary/50">
          <span className="font-label text-label-sm text-light-muted dark:text-dark-muted font-medium">
            Participants
          </span>
          <span className="font-headline text-headline-md font-bold tabular-nums">
            {metrics.participants}
          </span>
        </article>

        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border-2 border-accent p-4 flex flex-col gap-1 bg-accent/5">
          <span className="font-label text-label-sm text-accent font-semibold">
            Pending Apps
          </span>
          <span className="font-headline text-headline-md font-bold tabular-nums text-accent">
            {metrics.pendingApps}
          </span>
        </article>
      </section>

      {/* Mobile Alert Banner (Reference: UIUX/organizer_dashboard_mobile/code.html lines 145-155) */}
      {metrics.pendingApps > 0 && (
        <section className="rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-warning p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-md bg-warning/15 text-warning flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faClipboardList} className="text-base" />
            </span>
            <div>
              <p className="font-label text-label-md font-semibold text-light-on-surface dark:text-dark-on-surface">
                {pendingAlert.count} join requests waiting for approval
              </p>
              <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
                {pendingAlert.matchTitle} • {pendingAlert.schedule}
              </p>
            </div>
          </div>
          <Link
            to={ROUTES.ORGANIZER_APPLICATIONS}
            className="shrink-0 self-start sm:self-center px-4 py-2 rounded-md bg-warning text-on-warning font-label text-label-md font-semibold hover:opacity-90 transition-opacity"
          >
            Review Applications
          </Link>
        </section>
      )}

      {/* Analytics Chart with Recharts (Requirement 10 & Analytics section) */}
      <section className="p-6 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-title-lg font-bold">
              Weekly Player Attendance &amp; Fill Rate
            </h2>
            <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Total participants across your hosted turf sessions (Past 7 days)
            </p>
          </div>
          <span className="font-label text-xs font-semibold px-2.5 py-1 rounded bg-primary/15 text-primary border border-primary/20">
            Active Season
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" stroke="#9BAAA2" fontSize={12} tickLine={false} />
              <YAxis stroke="#9BAAA2" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1B2923',
                  borderColor: '#2C3B34',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="players" fill="#B9F34A" radius={[4, 4, 0, 0]} name="Players" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Upcoming Matches & Pending Applications Grid (Lines 343-390) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Active & Upcoming Matches (8 columns) */}
        <div className="lg:col-span-8 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-title-lg font-bold">
              Your Active &amp; Upcoming Matches
            </h2>
            <Link
              to={ROUTES.ORGANIZER_MATCHES}
              className="font-label text-label-md text-primary hover:underline font-semibold"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
            {activeMatches.map((m) => (
              <div
                key={m.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-title-md font-semibold truncate">
                      {m.title}
                    </span>
                    {m.pendingCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-warning text-on-warning font-label text-label-sm font-semibold shrink-0">
                        {m.pendingCount} pending
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-success text-on-success font-label text-label-sm font-semibold shrink-0">
                        {m.status}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-body-sm text-light-muted dark:text-dark-muted tabular-nums">
                    {m.timeText || `${m.date} • ${m.filledSlots} / ${m.totalSlots} players`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={ROUTES.ORGANIZER_MATCH_MANAGEMENT.replace(':matchId', m.id)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-on-surface dark:text-dark-on-surface border border-light-border dark:border-dark-border font-label text-label-md hover:border-primary transition-colors"
                  >
                    <span>Manage</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Applications Widget (4 columns) */}
        <aside className="lg:col-span-4 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col gap-4">
          <h2 className="font-headline text-title-lg font-bold">Pending Applications</h2>
          <p className="font-body text-body-sm text-light-muted dark:text-dark-muted leading-relaxed">
            {metrics.pendingApps} players applied to join {pendingAlert.matchTitle} ({pendingAlert.remainingSlots || 3} slots left). Review and approve candidates before roster closes.
          </p>
          <Link
            to={ROUTES.ORGANIZER_APPLICATIONS}
            className="w-full py-2.5 rounded-md bg-primary text-on-primary font-label text-label-md font-semibold hover:opacity-90 transition-opacity text-center"
          >
            Review Applications
          </Link>
        </aside>
      </section>
    </div>
  );
};

export default OrganizerDashboardPage;
