import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faCompass,
  faPlus,
  faTicket,
  faUser,
  faFutbol,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '../../constants/routes';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../../constants/roles';

export const MobileNavigation = ({ onOpenDrawer, className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const profileLink = isAuth
    ? (user?.role ? ROLE_HOME_ROUTES[user.role] : ROUTES.PLAYER_DASHBOARD)
    : ROUTES.LOGIN;

  const navItems = [
    { label: 'Home', path: ROUTES.HOME, icon: faHome },
    { label: 'Explore', path: ROUTES.EXPLORE_MATCHES, icon: faCompass },
    {
      label: 'Create',
      path: ROUTES.CREATE_QUICK_MATCH,
      icon: faPlus,
      isPrimaryAction: true,
    },
    { label: 'My Games', path: ROUTES.PLAYER_MATCHES, icon: faTicket },
    { label: 'Profile', path: profileLink, icon: faUser },
  ];

  return (
    <>
      {/* Mobile Top Header (Fixed at top on screens < 768px) */}
      <header className="md:hidden sticky top-0 z-40 h-14 px-4 bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-light-border dark:border-dark-border flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold">
            <FontAwesomeIcon icon={faFutbol} className="text-sm" />
          </span>
          <span className="font-headline font-bold text-base tracking-tight text-light-on-background dark:text-dark-on-background">
            Khela Hobe
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label="Open menu drawer"
              className="w-8 h-8 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface"
            >
              <FontAwesomeIcon icon={faBars} className="text-sm" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile 5-Item Bottom Bar (Fixed at bottom on screens < 768px) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-lg border-t border-light-border dark:border-dark-border px-2 flex items-center justify-around shadow-2xl"
      >
        {navItems.map((item) => {
          if (item.isPrimaryAction) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className="relative -top-4 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg border-4 border-light-background dark:border-dark-background flex items-center justify-center transition-transform active:scale-95"
                aria-label="Create Quick Match"
              >
                <FontAwesomeIcon icon={item.icon} className="text-lg" />
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 py-1 px-3 min-w-[56px] text-[11px] font-label transition-colors
                ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background'
                }
              `}
            >
              <FontAwesomeIcon icon={item.icon} className="text-base" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default MobileNavigation;
