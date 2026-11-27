import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from '../components/common/ThemeToggle';
import { ROUTES } from '../constants/routes';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-light-background dark:bg-dark-background text-light-on-background dark:text-dark-on-background transition-colors duration-200">
      {/* Top Utility Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 font-label text-sm font-semibold text-light-muted dark:text-dark-muted hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Flow Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
        {/* Horizontal Brand Identity from UIUX Design System */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center justify-center gap-2.5 mb-6 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <span className="w-10 h-10 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
            <FontAwesomeIcon icon={faFutbol} className="text-xl" />
          </span>
          <span className="font-headline text-headline-md font-bold tracking-tight text-light-on-background dark:text-dark-on-background">
            Khela Hobe
          </span>
        </Link>

        {/* Page Content Container */}
        <div className="w-full flex justify-center">
          <Outlet />
        </div>
      </main>

      {/* Auth Legal & Platform Footer */}
      <footer className="py-6 text-center font-body text-xs text-light-muted dark:text-dark-muted">
        <p>© 2026 Khela Hobe. Recreational Sports Network Bangladesh. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
