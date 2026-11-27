import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faHome, faCompass } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/common/Button';
import { ROUTES } from '../../constants/routes';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 sm:px-6">
      <div className="w-20 h-20 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-center text-primary mb-6 shadow-xl">
        <FontAwesomeIcon icon={faFutbol} className="text-4xl animate-bounce" />
      </div>

      <span className="font-mono text-sm font-semibold text-primary uppercase tracking-widest">
        Error 404
      </span>

      <h1 className="heading-3 sm:heading-2 font-headline font-bold text-light-on-background dark:text-dark-on-background mt-2">
        Out of Bounds
      </h1>

      <p className="body-2 text-light-muted dark:text-dark-muted max-w-md mt-2 text-pretty">
        The match, turf, or page you were looking for is off the pitch. Check the address or jump back into active games.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
        <Link to={ROUTES.HOME}>
          <Button variant="primary" size="md" icon={faHome}>
            Back to Home
          </Button>
        </Link>
        <Link to={ROUTES.EXPLORE_MATCHES}>
          <Button variant="tertiary" size="md" icon={faCompass}>
            Explore Matches
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
