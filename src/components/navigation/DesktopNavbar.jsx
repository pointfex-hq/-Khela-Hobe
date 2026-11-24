import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faArrowRight,
  faUser,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { ROLE_HOME_ROUTES, ROLES } from '../../constants/roles';
import ThemeToggle from '../common/ThemeToggle';
import Button from '../common/Button';

export const DesktopNavbar = ({
  links = [
    { label: 'Sports', href: '/#sports' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Explore Matches', href: ROUTES.EXPLORE_MATCHES },
    { label: 'Safety & Trust', href: '/#safety' },
  ],
  className = '',
}) => {
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);
  const location = useLocation();

  const getDashboardLink = () => {
    if (!user?.role) return ROUTES.PLAYER_DASHBOARD;
    return ROLE_HOME_ROUTES[user.role] || ROUTES.PLAYER_DASHBOARD;
  };

  return (
    <nav
      aria-label="Desktop primary navigation"
      className={`
        h-16 px-6 rounded-xl bg-light-surface/90 dark:bg-dark-surface/90
        backdrop-blur-md border border-light-border dark:border-dark-border
        shadow-sm flex items-center justify-between gap-6 transition-base ${className}
      `}
    >
      {/* Brand Logo */}
      <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
        <span className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold shadow-sm">
          <FontAwesomeIcon icon={faFutbol} className="text-base" />
        </span>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-lg tracking-tight text-light-on-background dark:text-dark-on-background">
            Khela Hobe
          </span>
          <span className="font-mono text-[10px] text-light-muted dark:text-dark-muted -mt-1">
            Bangladesh
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-6 lg:gap-8">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="font-label text-sm font-medium text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background transition-colors duration-state-change"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle />

        {isAuth ? (
          <div className="flex items-center gap-2">
            <Link to={getDashboardLink()}>
              <Button variant="secondary" size="sm" icon={faUser}>
                <span>{user?.name?.split(' ')[0] || 'Dashboard'}</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="w-9 h-9 rounded-md border border-light-border dark:border-dark-border flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-error hover:border-error transition-colors"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to={ROUTES.LOGIN}>
              <Button variant="tertiary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="sm" icon={faArrowRight} iconPosition="right">
                Join Free
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DesktopNavbar;
