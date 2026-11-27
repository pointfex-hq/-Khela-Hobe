import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faEyeSlash,
  faCircleExclamation,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialOAuthError = searchParams.get('error') || location.state?.error || '';
  const [authError, setAuthError] = useState(initialOAuthError);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const statusMessage = location.state?.message || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data) => {
    setAuthError('');
    const result = await login({
      email: data.identifier,
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

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            Welcome Back
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
            Sign in to your Khela Hobe account for Player, Organizer, and Guardian workspaces.
          </p>
        </div>

        {/* Registration / Status Banner */}
        {statusMessage && !authError && (
          <div className="p-3 rounded-md bg-success/10 border border-success/20 text-success text-xs font-body">
            {statusMessage}
          </div>
        )}

        {/* Global Error Banner */}
        {authError && (
          <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs font-body">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email Input */}
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
              Email Address
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                errors.identifier
                  ? 'border-error focus-visible:ring-error focus:border-error'
                  : 'border-light-border dark:border-dark-border'
              }`}
              {...register('identifier', {
                required: 'Please enter your email address',
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

        <div className="relative flex items-center justify-center">
          <span className="h-px flex-1 bg-light-border dark:bg-dark-border" />
          <span className="px-3 text-xs font-label text-light-muted dark:text-dark-muted uppercase">
            Or
          </span>
          <span className="h-px flex-1 bg-light-border dark:bg-dark-border" />
        </div>

        <GoogleSignInButton label="Continue with Google" />

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
