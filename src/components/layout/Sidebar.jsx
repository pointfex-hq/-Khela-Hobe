import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faHouse,
  faCompass,
  faMapLocationDot,
  faCalendarCheck,
  faFileLines,
  faTicket,
  faUser,
  faBell,
  faPlus,
  faUsers,
  faShieldHeart,
  faChartPie,
  faTrophy,
  faUsersGear,
  faGears,
  faTriangleExclamation,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { notificationService } from '../../services/endpoints/notificationService';

export const Sidebar = () => {
  const { user, role, switchDemoRole, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(3);

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

  const getNavSections = () => {
    switch (role) {
      case ROLES.ORGANIZER:
        return [
          {
            title: 'Organizer Hub',
            items: [
              { label: 'Overview', path: ROUTES.ORGANIZER_DASHBOARD, icon: faChartPie },
              { label: 'Create Quick Match', path: ROUTES.CREATE_QUICK_MATCH, icon: faPlus },
              { label: 'My Matches', path: ROUTES.ORGANIZER_MATCHES, icon: faCalendarCheck },
              { label: 'Event Management', path: ROUTES.ORGANIZER_EVENTS, icon: faTrophy },
              { label: 'Review Applications', path: ROUTES.ORGANIZER_APPLICATIONS, icon: faFileLines },
              { label: 'Ticket Check In', path: ROUTES.ORGANIZER_CHECK_IN, icon: faTicket },
            ],
          },
          {
            title: 'Account',
            items: [
              { label: 'Organizer Profile', path: ROUTES.ORGANIZER_PROFILE, icon: faUser },
            ],
          },
        ];
      case ROLES.GUARDIAN:
        return [
          {
            title: 'Guardian Oversight',
            items: [
              { label: 'Guardian Dashboard', path: ROUTES.GUARDIAN_DASHBOARD, icon: faChartPie },
              { label: 'Linked Children', path: ROUTES.GUARDIAN_CHILDREN, icon: faUsers },
              { label: 'Child Activity', path: ROUTES.GUARDIAN_CHILD_ACTIVITY, icon: faCalendarCheck },
              { label: 'Safety Settings', path: ROUTES.GUARDIAN_SAFETY, icon: faShieldHeart },
              { label: 'Safety Alerts', path: ROUTES.GUARDIAN_ALERTS, icon: faTriangleExclamation },
            ],
          },
        ];
      case ROLES.ADMIN:
        return [
          {
            title: 'Admin Control',
            items: [
              { label: 'Admin Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: faChartPie },
              { label: 'User Directory', path: ROUTES.ADMIN_USERS, icon: faUsersGear },
              { label: 'Match Moderation', path: ROUTES.ADMIN_MODERATION, icon: faCalendarCheck },
              { label: 'Sports Catalog', path: ROUTES.ADMIN_SPORTS, icon: faGears },
              { label: 'Reported Issues', path: ROUTES.ADMIN_REPORTS, icon: faTriangleExclamation },
            ],
          },
        ];
      case ROLES.PLAYER:
      default:
        return [
          {
            title: 'General',
            items: [
              { label: 'Home', path: ROUTES.PLAYER_DASHBOARD, icon: faHouse },
              { label: 'Explore', path: ROUTES.EXPLORE_MATCHES, icon: faCompass },
              { label: 'Map', path: ROUTES.PLAYER_MAP, icon: faMapLocationDot },
              { label: 'My Matches', path: ROUTES.PLAYER_MATCHES, icon: faCalendarCheck },
            ],
          },
          {
            title: 'Activity & Passes',
            items: [
              { label: 'Applications', path: ROUTES.PLAYER_APPLICATIONS, icon: faFileLines },
              { label: 'My Tickets', path: ROUTES.PLAYER_TICKETS, icon: faTicket },
            ],
          },
          {
            title: 'Account',
            items: [
              { label: 'My Profile', path: ROUTES.PLAYER_PROFILE, icon: faUser },
              {
                label: 'Notifications',
                path: ROUTES.PLAYER_NOTIFICATIONS,
                icon: faBell,
                badge: unreadCount > 0 ? unreadCount : null,
              },
            ],
          },
        ];
    }
  };

  const navSections = getNavSections();

  return (
    <aside className="w-64 shrink-0 border-r border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface min-h-screen flex flex-col justify-between p-4 transition-colors">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5 px-2 py-1 group">
          <span className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faFutbol} className="text-base" />
          </span>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-tight text-light-on-background dark:text-dark-on-background">
              Khela Hobe
            </span>
            <span className="font-label text-[10px] text-primary font-bold uppercase tracking-wider -mt-1">
              {ROLE_LABELS[role] || 'Player'} Workspace
            </span>
          </div>
        </Link>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-5" aria-label="Workspace navigation">
          {navSections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-1">
              <span className="px-3 font-label text-[11px] uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold">
                {sec.title}
              </span>
              {sec.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ROUTES.PLAYER_DASHBOARD}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3 py-2.5 rounded-md font-label text-sm font-medium transition-colors duration-state-change
                    ${
                      isActive
                        ? 'bg-primary text-on-primary font-semibold shadow-sm'
                        : 'text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={item.icon} className="text-sm w-4 text-center" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary font-label text-xs font-bold tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t border-light-border dark:border-dark-border">
        {/* User Card */}
        <Link
          to={ROUTES.PLAYER_PROFILE}
          className="p-2.5 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center gap-3 hover:border-primary transition-colors group"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User avatar'}
            className="w-10 h-10 rounded-full object-cover border border-primary/50 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0 flex-1">
            <p className="font-label text-sm font-bold text-light-on-surface dark:text-dark-on-surface truncate">
              {user?.name || 'Tanvir Hasan'}
            </p>
            <p className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
              {user?.city ? `${user.city} • Asia/Dhaka` : 'Player • Organizer'}
            </p>
          </div>
        </Link>

        {/* Demo Fast Switcher */}
        <div className="flex flex-col gap-1.5">
          <span className="font-label text-[10px] text-light-muted dark:text-dark-muted uppercase tracking-wider font-semibold">
            Demo Switch Workspace
          </span>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => switchDemoRole(ROLES.PLAYER)}
              className={`py-1 rounded text-[11px] font-semibold text-center transition-colors ${
                role === ROLES.PLAYER
                  ? 'bg-primary text-on-primary'
                  : 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted hover:text-primary'
              }`}
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole(ROLES.ORGANIZER)}
              className={`py-1 rounded text-[11px] font-semibold text-center transition-colors ${
                role === ROLES.ORGANIZER
                  ? 'bg-primary text-on-primary'
                  : 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted hover:text-primary'
              }`}
            >
              Org
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole(ROLES.GUARDIAN)}
              className={`py-1 rounded text-[11px] font-semibold text-center transition-colors ${
                role === ROLES.GUARDIAN
                  ? 'bg-primary text-on-primary'
                  : 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted hover:text-primary'
              }`}
            >
              Grd
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole(ROLES.ADMIN)}
              className={`py-1 rounded text-[11px] font-semibold text-center transition-colors ${
                role === ROLES.ADMIN
                  ? 'bg-primary text-on-primary'
                  : 'bg-light-surface-elevated dark:bg-dark-surface-elevated text-light-muted dark:text-dark-muted hover:text-primary'
              }`}
            >
              Adm
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
