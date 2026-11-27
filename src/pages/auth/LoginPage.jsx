import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faUserGroup,
  faCircleExclamation,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_HOME_ROUTES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login, switchDemoRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      identifier: 'tanvir@khelahobe.bd',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data) => {
    setAuthError('');
    const result = await login({
      identifier: data.identifier,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.success) {
      const destination =
        location.state?.from?.pathname ||
        (result.user?.role ? ROLE_HOME_ROUTES[result.user.role] : ROUTES.PLAYER_DASHBOARD);
      navigate(destination, { replace: true });
    } else {
      setAuthError(result.error || 'Invalid credentials. Please verify your details.');
    }
  };

  const handleDemoLogin = (role) => {
    setAuthError('');
    switchDemoRole(role);
    const destination = ROLE_HOME_ROUTES[role] || ROUTES.PLAYER_DASHBOARD;
    navigate(destination, { replace: true });
  };

  const setDemoCredentials = (role) => {
    setAuthError('');
    if (role === ROLES.PLAYER) {
      setValue('identifier', 'tanvir@khelahobe.bd');
      setValue('password', 'password123');
    } else if (role === ROLES.ORGANIZER) {
      setValue('identifier', 'rafiq@khelahobe.bd');
      setValue('password', 'password123');
    } else if (role === ROLES.GUARDIAN) {
      setValue('identifier', 'nusrat@khelahobe.bd');
      setValue('password', 'password123');
    } else if (role === ROLES.ADMIN) {
      setValue('identifier', 'admin@khelahobe.bd');
      setValue('password', 'adminpass123');
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            Welcome Back
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
            Sign in to one account for Player, Organizer, and Guardian workspaces.
          </p>
        </div>

        {/* Demo Fast-Switch Utility */}
        <div className="p-3.5 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-label font-semibold text-secondary dark:text-primary">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUserGroup} className="text-xs" />
              Demo Workspaces:
            </span>
            <span className="text-[11px] text-light-muted dark:text-dark-muted font-normal">
              Click to autofill or sign in
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoLogin(ROLES.PLAYER)}
              className="py-1.5 px-2 rounded text-xs font-label font-semibold text-center bg-light-surface dark:bg-dark-surface hover:border-primary border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background transition-colors"
              title="Click to sign in instantly as Player"
            >
              Player
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(ROLES.ORGANIZER)}
              className="py-1.5 px-2 rounded text-xs font-label font-semibold text-center bg-light-surface dark:bg-dark-surface hover:border-primary border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background transition-colors"
              title="Click to sign in instantly as Organizer"
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(ROLES.GUARDIAN)}
              className="py-1.5 px-2 rounded text-xs font-label font-semibold text-center bg-light-surface dark:bg-dark-surface hover:border-primary border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background transition-colors"
              title="Click to sign in instantly as Guardian"
            >
              Guardian
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin(ROLES.ADMIN)}
              className="py-1.5 px-2 rounded text-xs font-label font-semibold text-center bg-light-surface dark:bg-dark-surface hover:border-primary border border-light-border dark:border-dark-border text-light-on-background dark:text-dark-on-background transition-colors"
              title="Click to sign in instantly as Admin"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs font-body">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email or Phone Input */}
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
              Email or Phone Number
            </span>
            <input
              type="text"
              autoComplete="username"
              placeholder="tanvir@khelahobe.bd or +880 17..."
              className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                errors.identifier
                  ? 'border-error focus-visible:ring-error focus:border-error'
                  : 'border-light-border dark:border-dark-border'
              }`}
              {...register('identifier', {
                required: 'Please enter your email or phone number',
              })}
            />
            {errors.identifier && (
              <span className="font-body text-xs text-error mt-0.5">
                {errors.identifier.message}
              </span>
            )}
          </label>

          {/* Password Input */}
          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Password
              </span>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="font-label text-label-sm font-semibold text-secondary dark:text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                  errors.password
                    ? 'border-error focus-visible:ring-error focus:border-error'
                    : 'border-light-border dark:border-dark-border'
                }`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface p-1 rounded transition-colors"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
              </button>
            </div>
            {errors.password && (
              <span className="font-body text-xs text-error mt-0.5">
                {errors.password.message}
              </span>
            )}
          </label>

          {/* Remember Me Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer mt-1 select-none">
            <input
              type="checkbox"
              className="rounded text-primary focus:ring-primary h-4 w-4 border-light-border dark:border-dark-border dark:bg-dark-background"
              {...register('rememberMe')}
            />
            <span className="font-body text-body-sm text-light-muted dark:text-dark-muted">
              Keep me signed in on this device
            </span>
          </label>

          {/* Sign In CTA Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading || isSubmitting}
            icon={faArrowRight}
            iconPosition="right"
            className="mt-2 py-3 font-label text-label-lg font-bold"
          >
            Sign In
          </Button>
        </form>

        {/* Create Account Link */}
        <p className="font-body text-body-sm text-light-muted dark:text-dark-muted text-center pt-2 border-t border-light-border dark:border-dark-border">
          New to Khela Hobe?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-label text-label-md font-semibold text-secondary dark:text-primary hover:underline transition-colors"
          >
            Create an Account
          </Link>
        </p>
      </section>
    </div>
  );
};

export default LoginPage;
