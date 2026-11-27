import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faArrowRight,
  faArrowLeft,
  faCheckCircle,
  faCircleExclamation,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';

export const ForgotPasswordPage = () => {
  const [submittedIdentifier, setSubmittedIdentifier] = useState('');
  const [requestError, setRequestError] = useState('');
  const { forgotPassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      identifier: '',
    },
  });

  const onSubmit = async (data) => {
    setRequestError('');
    const result = await forgotPassword(data.identifier);
    if (result.success) {
      setSubmittedIdentifier(data.identifier);
    } else {
      setRequestError(result.error || 'Failed to dispatch recovery code.');
    }
  };

  const handleContinueToReset = () => {
    navigate(`${ROUTES.RESET_PASSWORD}?identifier=${encodeURIComponent(submittedIdentifier)}`);
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            Forgot Password
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
            Enter your registered email address or BD phone number to receive a secure recovery code.
          </p>
        </div>

        {/* Global Error Message */}
        {requestError && (
          <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs font-body">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {submittedIdentifier ? (
          /* Code Dispatched Success State */
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-md bg-success/10 border border-success/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-success font-label text-sm font-semibold">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Verification Code Sent!</span>
              </div>
              <p className="font-body text-xs text-light-on-surface dark:text-dark-on-surface">
                We sent a 6-digit verification code to{' '}
                <span className="font-semibold">{submittedIdentifier}</span>.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={handleContinueToReset}
              icon={faArrowRight}
              iconPosition="right"
              className="py-3 font-label text-label-lg font-bold"
            >
              Enter Verification Code
            </Button>

            <button
              type="button"
              onClick={() => setSubmittedIdentifier('')}
              className="font-label text-xs text-light-muted dark:text-dark-muted hover:text-light-on-surface dark:hover:text-dark-on-surface transition-colors"
            >
              Use a different email or phone
            </button>
          </div>
        ) : (
          /* Initial Form */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Email or BD Phone Number
              </span>
              <input
                type="text"
                autoComplete="email"
                placeholder="tanvir@khelahobe.bd or +880 17..."
                className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                  errors.identifier
                    ? 'border-error focus-visible:ring-error focus:border-error'
                    : 'border-light-border dark:border-dark-border'
                }`}
                {...register('identifier', {
                  required: 'Please enter your registered email or phone number',
                })}
              />
              {errors.identifier && (
                <span className="font-body text-xs text-error mt-0.5">
                  {errors.identifier.message}
                </span>
              )}
            </label>

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
              Send Reset Code
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

export default ForgotPasswordPage;
