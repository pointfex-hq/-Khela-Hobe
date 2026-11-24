import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFutbol,
  faBars,
  faXmark,
  faArrowRight,
  faUser,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { ROLE_HOME_ROUTES, ROLES } from '../../constants/roles';
import ThemeToggle from '../common/ThemeToggle';
import Button from '../common/Button';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const navLinks = [
    { label: 'Sports', href: '/#sports' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Matches', href: ROUTES.EXPLORE_MATCHES },
    { label: 'About Us', href: ROUTES.ABOUT },
    { label: 'Design System', href: ROUTES.DESIGN_SYSTEM },
    { label: 'Safety & Trust', href: '/#safety' },
  ];

  const getDashboardLink = () => {
    if (!user?.role) return ROUTES.PLAYER_DASHBOARD;
    return ROLE_HOME_ROUTES[user.role] || ROUTES.PLAYER_DASHBOARD;
  };

  return (
    <header className="sticky top-3 z-40 max-w-7xl mx-auto px-4 sm:px-6 w-full">
      <div className="h-16 px-4 sm:px-6 rounded-xl bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between gap-4 transition-base">
        {/* Brand Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
          <span className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold shadow-sm">
            <FontAwesomeIcon icon={faFutbol} className="text-base" />
          </span>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-tight text-light-on-background dark:text-dark-on-background">
              Khela Hobe
            </span>
            <span className="font-mono text-[10px] text-light-muted dark:text-dark-muted -mt-1 hidden sm:inline">
              Bangladesh
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-label text-sm font-medium text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background transition-colors duration-state-change"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle />

          {isAuth ? (
            <div className="flex items-center gap-2">
              <Link to={getDashboardLink()}>
                <Button variant="secondary" size="sm" icon={faUser}>
                  <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Dashboard'}</span>
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
              {/* Quick demo role selector for instant preview */}
              <div className="hidden lg:flex items-center gap-1 border-r border-light-border dark:border-dark-border pr-2 mr-1">
                <span className="font-label text-xs text-light-muted dark:text-dark-muted mr-1">Demo:</span>
                <button
                  type="button"
                  onClick={() => switchDemoRole(ROLES.PLAYER)}
                  className="px-2 py-1 text-xs rounded font-medium bg-light-surface-elevated dark:bg-dark-surface-elevated hover:text-primary transition-colors"
                >
                  Player
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole(ROLES.ORGANIZER)}
                  className="px-2 py-1 text-xs rounded font-medium bg-light-surface-elevated dark:bg-dark-surface-elevated hover:text-primary transition-colors"
                >
                  Organizer
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole(ROLES.GUARDIAN)}
                  className="px-2 py-1 text-xs rounded font-medium bg-light-surface-elevated dark:bg-dark-surface-elevated hover:text-primary transition-colors"
                >
                  Guardian
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole(ROLES.ADMIN)}
                  className="px-2 py-1 text-xs rounded font-medium bg-light-surface-elevated dark:bg-dark-surface-elevated hover:text-primary transition-colors"
                >
                  Admin
                </button>
              </div>

              <Link to={ROUTES.LOGIN} className="hidden sm:inline-block">
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

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border text-light-on-surface dark:text-dark-on-surface hover:border-primary transition-colors"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-xl bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-lg border border-light-border dark:border-dark-border shadow-xl flex flex-col gap-3 animate-fadeIn">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-label text-base font-medium py-2 px-3 rounded-md hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated text-light-on-background dark:text-dark-on-background"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-light-border dark:border-dark-border flex flex-col gap-2">
            {!isAuth ? (
              <>
                <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="tertiary" size="md" fullWidth>
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" fullWidth>
                    Join Free
                  </Button>
                </Link>
              </>
            ) : (
              <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" fullWidth>
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
