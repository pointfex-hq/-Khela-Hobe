import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faHome } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/common/Button';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../../constants/roles';

export const UnauthorizedPage = () => {
  const { role } = useAuth();
  const returnRoute = role ? ROLE_HOME_ROUTES[role] : ROUTES.HOME;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 sm:px-6">
      <div className="w-16 h-16 rounded-xl bg-error/15 text-error border border-error/30 flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faShieldHalved} className="text-3xl" />
      </div>

      <span className="font-mono text-sm font-semibold text-error uppercase tracking-widest">
        Access Restricted
      </span>

      <h1 className="heading-4 sm:heading-3 font-headline font-bold text-light-on-background dark:text-dark-on-background mt-2">
        Unauthorized Workspace
      </h1>

      <p className="body-4 text-light-muted dark:text-dark-muted max-w-md mt-2">
        Your current account role does not have permission to view this section. Please switch workspace or return to your dashboard.
      </p>

      <div className="mt-6">
        <Link to={returnRoute}>
          <Button variant="primary" size="md" icon={faHome}>
            Return to Authorized Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
