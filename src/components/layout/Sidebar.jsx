import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
  faMoneyBillTransfer,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { useNotifications } from '../../contexts/NotificationContext';

export const Sidebar = ({ isMobileDrawer = false, onNavigate }) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const adminPreviewRole = useAppStore((s) => s.adminPreviewRole);
  const setAdminPreviewRole = useAppStore((s) => s.setAdminPreviewRole);
  const { unreadCount } = useNotifications();

  const effectiveRole =
    role === ROLES.ADMIN && adminPreviewRole && adminPreviewRole !== ROLES.ADMIN
      ? adminPreviewRole
      : role;

  const profileDestination =
    effectiveRole === ROLES.ORGANIZER
      ? ROUTES.ORGANIZER_PROFILE
      : effectiveRole === ROLES.GUARDIAN
      ? ROUTES.GUARDIAN_DASHBOARD
      : effectiveRole === ROLES.ADMIN
      ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.PLAYER_PROFILE;

  const getNavSections = () => {
    switch (effectiveRole) {
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
              { label: 'Earnings & Payouts', path: ROUTES.ORGANIZER_EARNINGS, icon: faMoneyBillTransfer },
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
              { label: 'User & Approvals', path: ROUTES.ADMIN_USERS, icon: faUsersGear },
              { label: 'Tournaments Console', path: ROUTES.ADMIN_TOURNAMENTS, icon: faTrophy },
              { label: 'Match Moderation', path: ROUTES.ADMIN_MODERATION, icon: faCalendarCheck },
              { label: 'Sports Catalog', path: ROUTES.ADMIN_SPORTS, icon: faGears },
              { label: 'Bangladesh Locations', path: ROUTES.ADMIN_LOCATIONS, icon: faMapLocationDot },
              { label: 'Reported Issues', path: ROUTES.ADMIN_REPORTS, icon: faTriangleExclamation },
              { label: 'Settlements & Fees', path: ROUTES.ADMIN_SETTLEMENTS, icon: faMoneyBillTransfer },
              { label: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS, icon: faFileLines },
            ],
          },
        ];
      case ROLES.PLAYER:
      default: {
        const playerSections = [
          {
            title: 'General',
            items: [
              { label: 'Home', path: ROUTES.PLAYER_DASHBOARD, icon: faHouse },
              { label: 'Explore', path: ROUTES.PLAYER_EXPLORE, icon: faCompass },
              { label: 'Tournaments', path: ROUTES.TOURNAMENTS, icon: faTrophy },
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

        if (user?.quickMatchHostEnabled && !(user?.roles || []).includes(ROLES.ORGANIZER)) {
          playerSections.push({
            title: 'Quick Match Host',
            items: [
              { label: 'Create Quick Match', path: ROUTES.CREATE_QUICK_MATCH, icon: faPlus },
              { label: 'My Created Matches', path: ROUTES.ORGANIZER_MATCHES, icon: faCalendarCheck },
              { label: 'Review Applications', path: ROUTES.ORGANIZER_APPLICATIONS, icon: faFileLines },
            ],
          });
        }

        if (user?.parentalControlEnabled) {
          playerSections.push({
            title: 'Parental Control (Guardian)',
            items: [
              { label: 'Guardian Hub', path: ROUTES.GUARDIAN_DASHBOARD, icon: faChartPie },
              { label: 'Linked Children', path: ROUTES.GUARDIAN_CHILDREN, icon: faUsers },
              { label: 'Child Activity', path: ROUTES.GUARDIAN_CHILD_ACTIVITY, icon: faCalendarCheck },
              { label: 'Safety Settings', path: ROUTES.GUARDIAN_SAFETY, icon: faShieldHeart },
              { label: 'Safety Alerts', path: ROUTES.GUARDIAN_ALERTS, icon: faTriangleExclamation },
            ],
          });
        }

        return playerSections;
      }
    }
  };

  const navSections = getNavSections();

  return (
    <aside
      className={`${
        isMobileDrawer
          ? 'w-full flex-1'
          : 'w-64 shrink-0 border-r border-light-border dark:border-dark-border min-h-screen'
      } bg-light-surface dark:bg-dark-surface flex flex-col justify-between p-4 transition-colors`}
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header (hidden when already shown by mobile drawer shell) */}
        {!isMobileDrawer && (
          <Link to={ROUTES.HOME} onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-1 group">
            <span className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faFutbol} className="text-base" />
            </span>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg tracking-tight text-light-on-background dark:text-dark-on-background">
                Khela Hobe
              </span>
              <span className="font-label text-[10px] text-primary font-bold uppercase tracking-wider -mt-1">
                {ROLE_LABELS[effectiveRole] || 'Player'} Workspace
              </span>
            </div>
          </Link>
        )}

        {/* Admin Quick View Switcher (Admin | Player | Organizer) */}
        {role === ROLES.ADMIN && (
          <div className="p-1.5 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col gap-1">
            <span className="px-1.5 font-label text-[10px] uppercase tracking-wider text-light-muted dark:text-dark-muted font-semibold">
              Admin View As
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: ROLES.ADMIN, label: 'Admin', route: ROUTES.ADMIN_DASHBOARD },
                { id: ROLES.PLAYER, label: 'Player', route: ROUTES.PLAYER_DASHBOARD },
                { id: ROLES.ORGANIZER, label: 'Organizer', route: ROUTES.ORGANIZER_DASHBOARD },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setAdminPreviewRole(v.id);
                    navigate(v.route);
                    if (onNavigate) onNavigate();
                  }}
                  className={`py-1.5 rounded text-[11px] font-label font-semibold transition-colors ${
                    effectiveRole === v.id
                      ? 'bg-primary text-on-primary'
                      : 'text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
                  onClick={onNavigate}
                  end={item.path === ROUTES.PLAYER_DASHBOARD}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3 py-2.5 min-h-[42px] rounded-md font-label text-sm font-medium transition-colors duration-state-change
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

      <div className="flex flex-col gap-4 pt-4 mt-4 border-t border-light-border dark:border-dark-border">
        {/* User Card */}
        <Link
          to={profileDestination}
          onClick={onNavigate}
          className="p-2.5 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex items-center gap-3 hover:border-primary transition-colors group"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User avatar'}
            className="w-10 h-10 rounded-full object-cover border border-primary/50 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0 flex-1">
            <p className="font-label text-sm font-bold text-light-on-surface dark:text-dark-on-surface truncate">
              {user?.name || user?.fullName || 'Account'}
            </p>
            <p className="font-body text-xs text-light-muted dark:text-dark-muted truncate">
              {user?.city ? `${user.city} • Asia/Dhaka` : ROLE_LABELS[role] || 'Player'}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
