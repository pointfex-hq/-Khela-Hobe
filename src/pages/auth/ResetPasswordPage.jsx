import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faEyeSlash,
  faKey,
  faCircleExclamation,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';

export const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const [searchParams] = useSearchParams();
  const identifierParam = searchParams.get('identifier') || '';

  const { resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      code: '123456',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') || '';

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!passwordValue) {
      return {
        score: 0,
        label: 'Enter new password',
        color: 'bg-light-border dark:bg-dark-border',
        textColor: 'text-light-muted dark:text-dark-muted',
      };
    }
    let score = 0;
    if (passwordValue.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordValue) || /[0-9]/.test(passwordValue)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordValue) && passwordValue.length >= 10) score += 1;

    if (score === 1) {
      return { score: 1, label: 'Weak', color: 'bg-error', textColor: 'text-error' };
    }
    if (score === 2) {
      return { score: 2, label: 'Medium', color: 'bg-warning', textColor: 'text-warning' };
    }
    return { score: 3, label: 'Strong', color: 'bg-success', textColor: 'text-success' };
  }, [passwordValue]);

  const onSubmit = async (data) => {
    setResetError('');
    if (data.password !== data.confirmPassword) {
      setResetError('Passwords do not match. Please verify both fields.');
      return;
    }

    const result = await resetPassword({
      code: data.code,
      password: data.password,
    });

    if (result.success) {
      setResetSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { replace: true });
      }, 2000);
    } else {
      setResetError(result.error || 'Failed to reset password. Please check your verification code.');
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            Set New Password
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
            {identifierParam
              ? `Verification code sent to ${identifierParam}. Enter the 6-digit code and your new password.`
              : 'Enter your 6-digit verification code and configure a new password.'}
          </p>
        </div>

        {/* Global Error Banner */}
        {resetError && (
          <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs font-body">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 shrink-0" />
            <span>{resetError}</span>
          </div>
        )}

        {/* Success State */}
        {resetSuccess ? (
          <div className="p-4 rounded-md bg-success/10 border border-success/20 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-success text-on-success flex items-center justify-center text-xl">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h3 className="font-headline text-lg font-bold text-light-on-surface dark:text-dark-on-surface">
              Password Reset Complete!
            </h3>
            <p className="font-body text-xs text-light-muted dark:text-dark-muted">
              Your password has been securely updated. Redirecting you to the sign in page...
            </p>
            <Link to={ROUTES.LOGIN} className="w-full mt-2">
              <Button variant="primary" size="md" fullWidth>
                Sign In Now
              </Button>
            </Link>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* 6-Digit Code */}
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                6-Digit Verification Code
              </span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-mono tracking-widest text-center text-lg font-bold text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                    errors.code
                      ? 'border-error focus-visible:ring-error focus:border-error'
                      : 'border-light-border dark:border-dark-border'
                  }`}
                  {...register('code', {
                    required: 'Verification code is required',
                    minLength: { value: 6, message: 'Code must be 6 digits' },
                  })}
                />
              </div>
              {errors.code && (
                <span className="font-body text-xs text-error mt-0.5">{errors.code.message}</span>
              )}
            </label>

            {/* New Password */}
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                New Password
              </span>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                    errors.password
                      ? 'border-error focus-visible:ring-error focus:border-error'
                      : 'border-light-border dark:border-dark-border'
                  }`}
                  {...register('password', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
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

            {/* Confirm New Password */}
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Confirm New Password
              </span>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                    errors.confirmPassword
                      ? 'border-error focus-visible:ring-error focus:border-error'
                      : 'border-light-border dark:border-dark-border'
                  }`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (val) => val === watch('password') || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface p-1 rounded transition-colors"
                >
                  <FontAwesomeIcon
                    icon={showConfirmPassword ? faEyeSlash : faEye}
                    className="text-sm"
                  />
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="font-body text-xs text-error mt-0.5">
                  {errors.confirmPassword.message}
                </span>
              )}
            </label>

            {/* Password Strength Meter */}
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`h-1.5 flex-1 rounded-full transition-all duration-state-change ${
                  passwordStrength.score >= 1 ? passwordStrength.color : 'bg-light-border dark:bg-dark-border'
                }`}
              />
              <span
                className={`h-1.5 flex-1 rounded-full transition-all duration-state-change ${
                  passwordStrength.score >= 2 ? passwordStrength.color : 'bg-light-border dark:bg-dark-border'
                }`}
              />
              <span
                className={`h-1.5 flex-1 rounded-full transition-all duration-state-change ${
                  passwordStrength.score >= 3 ? passwordStrength.color : 'bg-light-border dark:bg-dark-border'
                }`}
              />
              <span
                className={`font-label text-label-sm font-semibold transition-colors ${passwordStrength.textColor}`}
              >
                {passwordStrength.label}
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isLoading || isSubmitting}
              className="mt-2 py-3 font-label text-label-lg font-bold"
            >
              Update Password
            </Button>
          </form>
        )}

        {/* Back to Sign In Link */}
        <p className="font-body text-body-sm text-light-muted dark:text-dark-muted text-center pt-2 border-t border-light-border dark:border-dark-border">
          Remember your password?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-label text-label-md font-semibold text-secondary dark:text-primary hover:underline transition-colors"
          >
            Back to Sign In
          </Link>
        </p>
      </section>
    </div>
  );
};

export default ResetPasswordPage;
