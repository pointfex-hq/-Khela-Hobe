import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faBars,
  faXmark,
  faRightFromBracket,
  faMagnifyingGlass,
  faBell,
  faArrowRightFromBracket,
  faRepeat,
  faHouse,
  faCompass,
  faPlus,
  faCalendarCheck,
  faUser,
  faGauge,
  faTrophy,
  faChild,
  faShieldHalved,
  faUsers,
  faMedal,
  faFlag,
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/layout/Sidebar';
import ThemeToggle from '../components/common/ThemeToggle';
import Badge from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
import { ROLE_LABELS, ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { useNotifications } from '../contexts/NotificationContext';
import { authService } from '../services/endpoints/authService';
import { toastService } from '../components/feedback/toastService';

export const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [dismissVerifyBanner, setDismissVerifyBanner] = useState(false);
  const { unreadCount } = useNotifications();
  const { user, role, logout, updateUserState } = useAuth();
  const adminPreviewRole = useAppStore((s) => s.adminPreviewRole);
  const setAdminPreviewRole = useAppStore((s) => s.setAdminPreviewRole);
  const navigate = useNavigate();
  const location = useLocation();

  const effectiveRole =
    role === ROLES.ADMIN && adminPreviewRole && adminPreviewRole !== ROLES.ADMIN
      ? adminPreviewRole
      : role;

  // Auto-close mobile overlays on route navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  const getBottomNavItems = () => {
    switch (effectiveRole) {
      case ROLES.ORGANIZER:
        return [
          { label: 'Hub', to: ROUTES.ORGANIZER_DASHBOARD, icon: faGauge },
          { label: 'Events', to: ROUTES.ORGANIZER_EVENTS, icon: faTrophy },
          { label: 'Create', to: ROUTES.CREATE_QUICK_MATCH, icon: faPlus, isPrimaryAction: true },
          { label: 'Matches', to: ROUTES.ORGANIZER_MATCHES, icon: faCalendarCheck },
          { label: 'Profile', to: ROUTES.ORGANIZER_PROFILE, icon: faUser },
        ];
      case ROLES.GUARDIAN:
        return [
          { label: 'Hub', to: ROUTES.GUARDIAN_DASHBOARD, icon: faGauge },
          { label: 'Children', to: ROUTES.GUARDIAN_CHILDREN, icon: faChild },
          { label: 'Activity', to: ROUTES.GUARDIAN_CHILD_ACTIVITY, icon: faCalendarCheck },
          { label: 'Alerts', to: ROUTES.GUARDIAN_ALERTS, icon: faBell },
          { label: 'Safety', to: ROUTES.GUARDIAN_SAFETY, icon: faShieldHalved },
        ];
      case ROLES.ADMIN:
        return [
          { label: 'Overview', to: ROUTES.ADMIN_DASHBOARD, icon: faGauge },
          { label: 'Users', to: ROUTES.ADMIN_USERS, icon: faUsers },
          { label: 'Matches', to: ROUTES.ADMIN_MODERATION, icon: faFutbol },
          { label: 'Sports', to: ROUTES.ADMIN_SPORTS, icon: faMedal },
          { label: 'Reports', to: ROUTES.ADMIN_REPORTS, icon: faFlag },
        ];
      case ROLES.PLAYER:
      default:
        return [
          { label: 'Home', to: ROUTES.PLAYER_DASHBOARD, icon: faHouse },
          { label: 'Explore', to: ROUTES.PLAYER_EXPLORE, icon: faCompass },
          { label: 'Create', to: ROUTES.CREATE_QUICK_MATCH, icon: faPlus, isPrimaryAction: true },
          { label: 'Matches', to: ROUTES.PLAYER_MATCHES, icon: faCalendarCheck },
          { label: 'Profile', to: ROUTES.PLAYER_PROFILE, icon: faUser },
        ];
    }
  };

  const bottomNavItems = getBottomNavItems();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const targetPath = role === ROLES.PLAYER || role === ROLES.ADMIN ? ROUTES.PLAYER_EXPLORE : ROUTES.EXPLORE_MATCHES;
    if (searchQuery.trim()) {
      navigate(`${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <div className="min-h-screen flex overflow-x-clip bg-light-background dark:bg-dark-background text-light-on-background dark:text-dark-on-background transition-colors duration-200">
      {/* Persistent Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Matches UIUX Shell Parity) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Mobile navigation drawer">
          <div
            className="fixed inset-0 bg-dark-background/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-[100dvh] bg-light-surface dark:bg-dark-surface shadow-2xl flex flex-col overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
            <div className="p-4 flex items-center justify-between border-b border-light-border dark:border-dark-border sticky top-0 z-10 bg-light-surface dark:bg-dark-surface">
              <span className="font-headline font-bold text-base flex items-center gap-2">
                <FontAwesomeIcon icon={faFutbol} className="text-primary" />
                <span>Khela Hobe</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated text-light-muted dark:text-dark-muted"
                aria-label="Close navigation"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>
            <Sidebar isMobileDrawer onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (sticky on mobile & desktop for quick thumb access) */}
        <header className="sticky top-0 z-30 border-b border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md">
          <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
            {/* Mobile Menu Button & Compact Brand */}
            <div className="flex items-center gap-2.5 lg:hidden min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary shrink-0"
              >
                <FontAwesomeIcon icon={faBars} className="text-sm" />
              </button>
              <Link to={ROUTES.HOME} className="flex items-center gap-1.5 sm:hidden min-w-0">
                <FontAwesomeIcon icon={faFutbol} className="text-primary text-sm shrink-0" />
                <span className="font-headline font-bold text-sm truncate">Khela Hobe</span>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:flex items-center">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3.5 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search matches, venues, or players..."
                className="w-full pl-9 pr-4 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface placeholder:text-light-muted dark:placeholder:text-dark-muted font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors"
              />
            </form>

            {/* Right Header Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto shrink-0">
              {/* Mobile Search Trigger */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                aria-label="Search matches"
                className={`sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border transition-colors ${
                  mobileSearchOpen
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted'
                }`}
              >
                <FontAwesomeIcon icon={mobileSearchOpen ? faXmark : faMagnifyingGlass} className="text-sm" />
              </button>

              {/* Dark/Light Theme Toggle */}
              <ThemeToggle />

              {/* Notifications Button with Unread Badge */}
              <Link
                to={role === ROLES.GUARDIAN ? ROUTES.GUARDIAN_ALERTS : ROUTES.PLAYER_NOTIFICATIONS}
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary transition-colors"
              >
                <FontAwesomeIcon icon={faBell} className="text-sm text-light-muted dark:text-dark-muted" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-on-primary font-label text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-1.5 sm:gap-2 border-l border-light-border dark:border-dark-border pl-1.5 sm:pl-3">
              <Link
                to={
                  role === ROLES.ORGANIZER
                    ? ROUTES.ORGANIZER_PROFILE
                    : role === ROLES.GUARDIAN
                    ? ROUTES.GUARDIAN_DASHBOARD
                    : role === ROLES.ADMIN
                    ? ROUTES.ADMIN_DASHBOARD
                    : ROUTES.PLAYER_PROFILE
                }
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'User avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-primary/50 hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/40 flex items-center justify-center font-headline text-xs font-bold uppercase hover:scale-105 transition-transform">
                    {(user?.name || user?.email || 'U').charAt(0)}
                  </div>
                )}
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="w-9 h-9 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-error hover:border-error transition-colors"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
              </button>
            </div>
          </div>
          </div>

          {/* Expandable Mobile Search Bar */}
          {mobileSearchOpen && (
            <form
              onSubmit={handleSearchSubmit}
              className="sm:hidden px-3 pb-3 pt-1 flex items-center gap-2 border-t border-light-border/60 dark:border-dark-border/60"
            >
              <div className="relative flex-1 flex items-center">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
                />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search matches, venues, or players..."
                  className="w-full pl-8 pr-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-md bg-primary text-on-primary font-label text-xs font-semibold shrink-0"
              >
                Go
              </button>
            </form>
          )}
        </header>

        {/* Content Viewport with mobile bottom navigation spacing */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex flex-col gap-5 sm:gap-6 min-w-0">
          {/* Admin Preview Mode Diagnostic Banner */}
          {role === ROLES.ADMIN && effectiveRole !== ROLES.ADMIN && (
            <div className="rounded-lg bg-primary/10 border border-primary/40 p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <strong className="text-primary font-label">
                  Admin Diagnostic Mode — Viewing as {ROLE_LABELS[effectiveRole] || effectiveRole}
                </strong>
                <span className="text-light-muted dark:text-dark-muted block sm:inline sm:ml-2">
                  Inspecting the live user interface without signing out of Admin.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAdminPreviewRole(ROLES.PLAYER);
                    navigate(ROUTES.PLAYER_DASHBOARD);
                  }}
                  className={`px-2.5 py-1 rounded font-label font-semibold ${
                    effectiveRole === ROLES.PLAYER
                      ? 'bg-primary text-on-primary'
                      : 'border border-light-border dark:border-dark-border'
                  }`}
                >
                  Player View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPreviewRole(ROLES.ORGANIZER);
                    navigate(ROUTES.ORGANIZER_DASHBOARD);
                  }}
                  className={`px-2.5 py-1 rounded font-label font-semibold ${
                    effectiveRole === ROLES.ORGANIZER
                      ? 'bg-primary text-on-primary'
                      : 'border border-light-border dark:border-dark-border'
                  }`}
                >
                  Organizer View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPreviewRole(ROLES.ADMIN);
                    navigate(ROUTES.ADMIN_DASHBOARD);
                  }}
                  className="px-2.5 py-1 rounded bg-light-surface dark:bg-dark-surface border border-primary text-primary font-label font-semibold"
                >
                  Back to Admin Panel
                </button>
              </div>
            </div>
          )}
          {/* Email OTP Verification Banner for unverified password signups */}
          {user && !user.emailVerified && !user.googleLinked && !dismissVerifyBanner && (
            <div className="rounded-lg bg-warning/10 border border-warning/40 p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm">
                <strong className="text-warning font-label block">
                  Verify your email address ({user.email})
                </strong>
                <span className="text-light-muted dark:text-dark-muted">
                  Enter the 6-digit OTP sent to your inbox, or link Gmail in Profile to verify automatically.
                </span>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!otpInput.trim()) return;
                  setVerifyingOtp(true);
                  try {
                    const res = await authService.verifyEmailOtp({ code: otpInput.trim(), email: user.email });
                    if (res?.user) updateUserState(res.user);
                    toastService.success('Email verified successfully!');
                    setOtpInput('');
                  } catch (err) {
                    toastService.error(err?.message || 'Invalid or expired verification code.');
                  } finally {
                    setVerifyingOtp(false);
                  }
                }}
                className="flex flex-wrap items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-28 px-2.5 py-1.5 rounded bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono text-xs text-center tracking-widest"
                />
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="px-3 py-1.5 rounded bg-primary text-on-primary font-label text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {verifyingOtp ? '...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  disabled={resendingOtp}
                  onClick={async () => {
                    setResendingOtp(true);
                    try {
                      const r = await authService.resendEmailOtp(user.email);
                      toastService.success(r?.message || 'New OTP dispatched!');
                    } catch (err) {
                      toastService.error(err?.message || 'Failed to resend OTP.');
                    } finally {
                      setResendingOtp(false);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border font-label text-xs hover:border-primary"
                >
                  {resendingOtp ? 'Sending...' : 'Resend'}
                </button>
                <button
                  type="button"
                  onClick={() => setDismissVerifyBanner(true)}
                  className="text-xs text-light-muted hover:text-light-on-surface px-1"
                  aria-label="Dismiss verification reminder"
                >
                  Later
                </button>
              </form>
            </div>
          )}

          {/* Organizer Approval Pending / Rejected Banner */}
          {role === ROLES.ORGANIZER && user?.organizerApprovalStatus && user.organizerApprovalStatus !== 'APPROVED' && (
            <div className="rounded-lg bg-accent/10 border border-accent/40 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
              <div>
                <strong className="text-accent font-label block">
                  {user.organizerApprovalStatus === 'REJECTED'
                    ? 'Organizer Verification Rejected'
                    : 'Organizer Account Pending Admin Verification'}
                </strong>
                <span className="text-light-muted dark:text-dark-muted">
                  {user.organizerApprovalStatus === 'REJECTED'
                    ? user.organizerApprovalNote || 'Creation privileges are disabled. Please review with an Admin.'
                    : 'You can browse all Organizer tools right now, while creating matches, tournaments, and venues unlocks once an Admin approves your account.'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-accent/20 text-accent font-label text-xs font-bold shrink-0 self-start sm:self-center">
                {user.organizerApprovalStatus}
              </span>
            </div>
          )}

          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Persistent across mobile viewports < 1024px) */}
        <nav
          aria-label="Mobile bottom navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 min-h-[4rem] pt-1 pb-safe border-t border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md px-1.5 grid items-center"
          style={{ gridTemplateColumns: `repeat(${bottomNavItems.length}, minmax(0, 1fr))` }}
        >
          {bottomNavItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== ROUTES.PLAYER_DASHBOARD &&
                item.to !== ROUTES.ORGANIZER_DASHBOARD &&
                item.to !== ROUTES.GUARDIAN_DASHBOARD &&
                item.to !== ROUTES.ADMIN_DASHBOARD &&
                location.pathname.startsWith(item.to));

            if (item.isPrimaryAction) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex flex-col items-center justify-center -mt-5 group"
                  aria-label={item.label}
                >
                  <span className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center border-4 border-light-background dark:border-dark-background shadow-lg group-hover:scale-105 transition-transform">
                    <FontAwesomeIcon icon={item.icon} className="text-base" />
                  </span>
                  <span className="font-label text-[11px] font-semibold text-primary mt-0.5">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 transition-colors py-1 ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <FontAwesomeIcon icon={item.icon} className="text-sm" />
                <span className="font-label text-[11px] leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
