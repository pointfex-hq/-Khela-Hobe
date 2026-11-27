import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { error: error || 'Google sign-in did not return an authorization code.' },
      });
      return;
    }

    completeGoogleLogin(code).then((result) => {
      if (result?.success) {
        const destination = result.user?.role
          ? ROLE_HOME_ROUTES[result.user.role] || ROUTES.PLAYER_DASHBOARD
          : ROUTES.PLAYER_DASHBOARD;
        navigate(destination, { replace: true });
      } else {
        navigate(ROUTES.LOGIN, { replace: true });
      }
    });
  }, [searchParams, navigate, completeGoogleLogin]);

  return (
    <div className="w-full max-w-md py-16 flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" message="Completing Google sign-in..." />
    </div>
  );
};

export default GoogleCallbackPage;
