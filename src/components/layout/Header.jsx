import React, { useEffect, useState } from 'react';
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
import { ROLE_HOME_ROUTES } from '../../constants/roles';
import ThemeToggle from '../common/ThemeToggle';
import Button from '../common/Button';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Explore Matches', to: ROUTES.EXPLORE_MATCHES },
    { label: 'Tournaments', to: ROUTES.TOURNAMENTS },
    { label: 'Sports', href: '/#sports' },
    { label: 'About', to: ROUTES.ABOUT },
  ];

  const getDashboardLink = () => {
    if (!user?.role) return ROUTES.PLAYER_DASHBOARD;
    return ROLE_HOME_ROUTES[user.role] || ROUTES.PLAYER_DASHBOARD;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-md transition-base">
      <div className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
          <span className="w-9 h-9 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold shadow-sm">
            <FontAwesomeIcon icon={faFutbol} className="text-base" />
          </span>
          <span className="font-headline font-bold text-lg tracking-tight text-light-on-background dark:text-dark-on-background">
            Khela Hobe
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                className={`font-label text-sm font-medium transition-colors duration-state-change ${
                  location.pathname === link.to
                    ? 'text-primary'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background'
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="font-label text-sm font-medium text-light-muted dark:text-dark-muted hover:text-light-on-background dark:hover:text-dark-on-background transition-colors duration-state-change"
              >
                {link.label}
              </a>
            )
          )}
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
        <div className="md:hidden px-4 pb-5 pt-2 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface flex flex-col gap-1.5 shadow-xl">
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-label text-base font-medium min-h-[44px] px-3 rounded-md flex items-center ${
                  location.pathname === link.to
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated text-light-on-background dark:text-dark-on-background'
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-label text-base font-medium min-h-[44px] px-3 rounded-md flex items-center hover:bg-light-surface-elevated dark:hover:bg-dark-surface-elevated text-light-on-background dark:text-dark-on-background"
              >
                {link.label}
              </a>
            )
          )}

          <div className="pt-3 mt-1 border-t border-light-border dark:border-dark-border flex flex-col gap-2">
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
              <>
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" fullWidth>
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
