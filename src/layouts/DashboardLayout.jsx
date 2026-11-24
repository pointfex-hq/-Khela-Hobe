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
import { ROLE_LABELS, ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { notificationService } from '../services/endpoints/notificationService';

export const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);
  const { user, role, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getBottomNavItems = () => {
    switch (role) {
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

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (typeof res?.count === 'number') {
          setUnreadCount(res.count);
        }
      } catch {
        // Fallback
      }
    };
    fetchUnread();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.EXPLORE_MATCHES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-light-background dark:bg-dark-background text-light-on-background dark:text-dark-on-background transition-colors duration-200">
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
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-light-surface dark:bg-dark-surface shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-light-border dark:border-dark-border">
              <span className="font-headline font-bold text-base flex items-center gap-2">
                <FontAwesomeIcon icon={faFutbol} className="text-primary" />
                <span>Workspace Menu</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated text-light-muted dark:text-dark-muted"
                aria-label="Close navigation"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Top Header (Lines 275-298 in Reference) */}
        <header className="sticky top-0 z-30 h-16 border-b border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-primary shrink-0"
          >
            <FontAwesomeIcon icon={faBars} className="text-sm" />
          </button>

          {/* Search Bar with Submit Handler */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3.5 text-light-muted dark:text-dark-muted text-xs pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches, venues, or players in Bangladesh..."
              className="w-full pl-9 pr-4 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface placeholder:text-light-muted dark:placeholder:text-dark-muted font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors"
            />
          </form>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {/* Public Home Link */}
            <Link
              to={ROUTES.HOME}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-light-border dark:border-dark-border hover:border-primary font-label text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors"
              title="Return to public landing page"
            >
              <FontAwesomeIcon icon={faHouse} className="text-primary text-xs" />
              <span>Public Site</span>
            </Link>

            {/* Active Workspace Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="hidden sm:inline">{ROLE_LABELS[role] || 'Player'} Workspace</span>
              <span className="sm:hidden">{ROLE_LABELS[role]?.split(' ')[0] || 'Player'}</span>
            </div>

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Button with Unread Badge */}
            <Link
              to={ROUTES.PLAYER_NOTIFICATIONS}
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
            <div className="flex items-center gap-2 border-l border-light-border dark:border-dark-border pl-2 sm:pl-3">
              <Link to={ROUTES.PLAYER_PROFILE}>
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user?.name || 'User avatar'}
                  className="w-8 h-8 rounded-full object-cover border border-primary/50 hover:scale-105 transition-transform"
                />
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-error hover:border-error transition-colors"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Viewport with mobile bottom navigation spacing */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex flex-col gap-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Persistent across mobile viewports <= 1024px) */}
        <nav
          aria-label="Mobile bottom navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md px-2 grid items-center"
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
