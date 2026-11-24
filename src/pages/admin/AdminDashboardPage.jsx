import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUsersGear,
  faCalendarCheck,
  faTriangleExclamation,
  faGears,
  faShieldHalved,
  faFlag,
  faChartColumn,
  faCheckCircle,
  faChevronRight,
  faBolt,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '../../services/endpoints/adminService';
import { ROUTES } from '../../constants/routes';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAdminDashboard();
        if (isMounted && res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
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
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <LoadingSpinner size="lg" text="Loading platform administration overview..." />
      </div>
    );
  }

  const {
    metrics,
    weeklyActivity = [],
    roleDistribution = [],
    recentModerationActions = [],
  } = data || {};

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
            <FontAwesomeIcon icon={faShieldHalved} className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl sm:text-2xl text-light-on-background dark:text-dark-on-background">
                Platform Administration
              </h1>
              <Badge variant="primary" size="sm">
                Moderation Mode
              </Badge>
            </div>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
              Dhaka, Chattogram &amp; Divisional Sports Oversight
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={faUsersGear}
            onClick={() => navigate(ROUTES.ADMIN_USERS)}
          >
            User Directory
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={faFlag}
            onClick={() => navigate(ROUTES.ADMIN_REPORTS)}
          >
            Review Reports ({metrics?.pendingReports || 7})
          </Button>
        </div>
      </div>

      {/* Post-Publication Moderation Policy Banner */}
      <div className="rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border p-4 flex items-center gap-3 shadow-sm">
        <span className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faBolt} className="text-sm" />
        </span>
        <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted leading-relaxed">
          <strong className="text-light-on-surface dark:text-dark-on-surface font-semibold">
            Post-Publication Moderation:
          </strong>{' '}
          Quick Matches publish immediately across Bangladesh without pre-approval queues. Platform
          moderators investigate player safety reports and suspend non-compliant matches in real time.
        </p>
      </div>

      {/* 6 Platform Metrics (Reference lines 214-239 in UIUX/admin_dashboard/code.html) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Users */}
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 shadow-sm">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted">Total Users</span>
          <span className="font-headline font-bold text-xl sm:text-2xl tabular-nums text-light-on-surface dark:text-dark-on-surface">
            {metrics?.totalUsers?.toLocaleString() || '4,820'}
          </span>
          <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
            Players &amp; Hosts
          </span>
        </article>

        {/* Active Users */}
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 shadow-sm">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted">Active Users</span>
          <span className="font-headline font-bold text-xl sm:text-2xl tabular-nums text-success">
            {metrics?.activeUsers?.toLocaleString() || '1,420'}
          </span>
          <span className="font-body text-[11px] text-success">This month</span>
        </article>

        {/* Total Matches */}
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 shadow-sm">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted">Total Matches</span>
          <span className="font-headline font-bold text-xl sm:text-2xl tabular-nums text-light-on-surface dark:text-dark-on-surface">
            {metrics?.totalMatches?.toLocaleString() || '964'}
          </span>
          <span className="font-body text-[11px] text-light-muted dark:text-dark-muted">
            All-time held
          </span>
        </article>

        {/* Active Matches */}
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 shadow-sm">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted">Active Matches</span>
          <span className="font-headline font-bold text-xl sm:text-2xl tabular-nums text-primary">
            {metrics?.activeMatches || '66'}
          </span>
          <span className="font-body text-[11px] text-primary">Live or upcoming</span>
        </article>

        {/* Reported Matches */}
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 flex flex-col gap-1 shadow-sm">
          <span className="font-label text-xs text-light-muted dark:text-dark-muted">Reported Matches</span>
          <span className="font-headline font-bold text-xl sm:text-2xl tabular-nums text-warning">
            {metrics?.reportedMatches || '3'}
          </span>
          <span className="font-body text-[11px] text-warning">Flagged by players</span>
        </article>

        {/* Pending Reports */}
        <article className="rounded-lg bg-light-surface dark:bg-dark-surface border border-error/70 p-4 flex flex-col gap-1 shadow-sm bg-error/[0.03]">
          <span className="font-label text-xs text-error font-semibold">Pending Reports</span>
          <span className="font-headline font-bold text-xl sm:text-2xl tabular-nums text-error">
            {metrics?.pendingReports || '7'}
          </span>
          <span className="font-body text-[11px] text-error">Needs review</span>
        </article>
      </section>

      {/* User Role Quick Distribution */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="font-label text-xs text-light-muted dark:text-dark-muted">Players</span>
            <p className="font-headline font-bold text-lg text-primary tabular-nums">
              {metrics?.totalPlayers?.toLocaleString() || '3,280'}
            </p>
          </div>
          <FontAwesomeIcon icon={faUsers} className="text-primary text-lg" />
        </div>

        <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="font-label text-xs text-light-muted dark:text-dark-muted">Organizers</span>
            <p className="font-headline font-bold text-lg text-secondary tabular-nums">
              {metrics?.totalOrganizers?.toLocaleString() || '940'}
            </p>
          </div>
          <FontAwesomeIcon icon={faUsersGear} className="text-secondary text-lg" />
        </div>

        <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="font-label text-xs text-light-muted dark:text-dark-muted">Guardians</span>
            <p className="font-headline font-bold text-lg text-accent tabular-nums">
              {metrics?.totalGuardians?.toLocaleString() || '600'}
            </p>
          </div>
          <FontAwesomeIcon icon={faShieldHalved} className="text-accent text-lg" />
        </div>

        <div className="p-3.5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="font-label text-xs text-light-muted dark:text-dark-muted">Tournaments</span>
            <p className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface tabular-nums">
              {metrics?.totalEvents || '48'}
            </p>
          </div>
          <FontAwesomeIcon icon={faTrophy} className="text-warning text-lg" />
        </div>
      </section>

      {/* Charts Section: Weekly Activity & Recent Moderation Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col (7 cols): Recharts Weekly Match Activity */}
        <div className="lg:col-span-7 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="font-headline font-bold text-lg sm:text-xl text-light-on-surface dark:text-dark-on-surface">
                Weekly Quick Matches (Bangladesh)
              </h2>
              <p className="font-body text-xs text-light-muted dark:text-dark-muted">
                Instant published match activity • Thursday &amp; Friday peak hours
              </p>
            </div>
            <span className="font-mono text-xs text-primary self-start sm:self-auto">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  stroke="#56615D"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#2C3B34' }}
                />
                <YAxis
                  stroke="#56615D"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#2C3B34' }}
                  tabularNums
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-md bg-dark-surface border border-dark-border text-xs text-white shadow-xl">
                          <p className="font-bold text-primary mb-1">{label} Quick Matches</p>
                          <p>Matches: {payload[0].value}</p>
                          <p className="text-dark-muted">Estimated Players: {payload[0].payload.players}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="matches"
                  radius={[4, 4, 0, 0]}
                  fill="#26865B"
                >
                  {weeklyActivity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPeak ? '#B9F34A' : '#26865B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-light-muted dark:text-dark-muted pt-2 border-t border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-secondary" />
                <span>Regular Days</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary" />
                <span>Weekend Peak</span>
              </span>
            </div>
            <span className="font-body text-[11px]">Updated every 15 mins</span>
          </div>
        </div>

        {/* Right Col (5 cols): Recent Moderation Actions Log */}
        <div className="lg:col-span-5 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
              Recent Moderation Actions
            </h2>
            <Link
              to={ROUTES.ADMIN_REPORTS}
              className="font-label text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-light-border dark:divide-dark-border">
            {recentModerationActions.map((action) => (
              <div key={action.id} className="py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs sm:text-sm font-semibold text-light-on-surface dark:text-dark-on-surface">
                    {action.title}
                  </span>
                  <span className="font-mono text-[11px] text-light-muted dark:text-dark-muted tabular-nums">
                    {action.time}
                  </span>
                </div>
                <p className="font-body text-xs text-light-muted dark:text-dark-muted line-clamp-1">
                  {action.description}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-light-border dark:border-dark-border">
            <Button
              variant="outline"
              size="sm"
              icon={faCalendarCheck}
              onClick={() => navigate(ROUTES.ADMIN_MODERATION)}
              className="w-full text-xs"
            >
              Match Console
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={faGears}
              onClick={() => navigate(ROUTES.ADMIN_SPORTS)}
              className="w-full text-xs"
            >
              Sports Catalog
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
