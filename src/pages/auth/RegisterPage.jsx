import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faEyeSlash,
  faUser,
  faRunning,
  faTrophy,
  faShieldHalved,
  faCircleExclamation,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_HOME_ROUTES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES.PLAYER);
  const [regError, setRegError] = useState('');

  const { register: registerAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const passwordValue = watch('password') || '';

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!passwordValue) return { score: 0, label: 'Enter password', color: 'bg-light-border dark:bg-dark-border', textColor: 'text-light-muted dark:text-dark-muted' };
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
    setRegError('');
    if (data.password !== data.confirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    const payload = {
      fullName: data.name,
      email: data.email,
      phoneNumber: data.phone,
      dateOfBirth: data.dateOfBirth,
      password: data.password,
      role: selectedRole,
    };

    const result = await registerAuth(payload);

    if (result.success) {
      if (result.user) {
        const destination = ROLE_HOME_ROUTES[result.user.role || selectedRole] || ROUTES.PLAYER_DASHBOARD;
        navigate(destination, { replace: true });
      } else {
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: { message: 'Registration successful. Please login.' },
        });
      }
    } else {
      setRegError(result.error || 'Failed to complete registration. Please try again.');
    }
  };

  const roleOptions = [
    {
      id: ROLES.PLAYER,
      label: 'Player',
      desc: 'Join games & enable Parental Control anytime',
      icon: faRunning,
    },
    {
      id: ROLES.ORGANIZER,
      label: 'Organizer',
      desc: 'Host matches & tournaments (Admin verified)',
      icon: faTrophy,
    },
  ];

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 sm:p-8 flex flex-col gap-5 shadow-sm">
        {/* Header Block */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline text-headline-md font-bold text-light-on-surface dark:text-dark-on-surface tracking-tight">
            Join the Squad
          </h1>
          <p className="font-body text-body-md text-light-muted dark:text-dark-muted">
            Create your Khela Hobe account to discover and organize matches across Bangladesh.
          </p>
        </div>

        {/* Global Error Banner */}
        {regError && (
          <div className="p-3 rounded-md bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs font-body">
            <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 shrink-0" />
            <span>{regError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Role Selection Tabs */}
          <div className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
              Select Account Type
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roleOptions.map((opt) => {
                const isSelected = selectedRole === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRole(opt.id)}
                    className={`p-3 rounded-md border text-left transition-all duration-state-change flex flex-col gap-1 relative ${
                      isSelected
                        ? 'border-primary bg-primary/10 dark:bg-primary/15'
                        : 'border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background hover:border-light-muted dark:hover:border-dark-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <FontAwesomeIcon
                        icon={opt.icon}
                        className={`text-sm ${
                          isSelected ? 'text-secondary dark:text-primary' : 'text-light-muted dark:text-dark-muted'
                        }`}
                      />
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px]">
                          <FontAwesomeIcon icon={faCheck} />
                        </span>
                      )}
                    </div>
                    <span className="font-label text-label-md font-semibold text-light-on-surface dark:text-dark-on-surface mt-1">
                      {opt.label}
                    </span>
                    <span className="font-body text-[11px] text-light-muted dark:text-dark-muted leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedRole === ROLES.ORGANIZER && (
              <p className="text-[11px] font-body text-warning mt-1">
                Organizer accounts require Admin approval before creating matches or tournaments. You can browse Organizer tools immediately after signing up.
              </p>
            )}
          </div>

          {/* Full Name */}
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
              Full Name
            </span>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g., Tanvir Hasan"
              className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                errors.name
                  ? 'border-error focus-visible:ring-error focus:border-error'
                  : 'border-light-border dark:border-dark-border'
              }`}
              {...register('name', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.name && (
              <span className="font-body text-xs text-error mt-0.5">{errors.name.message}</span>
            )}
          </label>

          {/* 2-Column: Email & BD Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                  errors.email
                    ? 'border-error focus-visible:ring-error focus:border-error'
                    : 'border-light-border dark:border-dark-border'
                }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <span className="font-body text-xs text-error mt-0.5">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Phone (BD)
              </span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+880 17XX-XXXXXX"
                className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md tabular-nums text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                  errors.phone
                    ? 'border-error focus-visible:ring-error focus:border-error'
                    : 'border-light-border dark:border-dark-border'
                }`}
                {...register('phone', {
                  required: 'Phone number is required',
                  minLength: { value: 11, message: 'Please enter a valid Bangladesh phone number' },
                })}
              />
              {errors.phone && (
                <span className="font-body text-xs text-error mt-0.5">
                  {errors.phone.message}
                </span>
              )}
            </label>
          </div>

          {/* Date of Birth */}
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
              Date of Birth
            </span>
            <input
              type="date"
              className={`w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md tabular-nums text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                errors.dateOfBirth
                  ? 'border-error focus-visible:ring-error focus:border-error'
                  : 'border-light-border dark:border-dark-border'
              }`}
              {...register('dateOfBirth', {
                required: 'Date of birth is required for age-appropriate match discovery',
              })}
            />
            {errors.dateOfBirth && (
              <span className="font-body text-xs text-error mt-0.5">
                {errors.dateOfBirth.message}
              </span>
            )}
          </label>

          {/* 2-Column: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Password
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
                    required: 'Password is required',
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

            <label className="flex flex-col gap-1.5">
              <span className="font-label text-label-md font-medium text-light-on-surface dark:text-dark-on-surface">
                Confirm Password
              </span>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-md bg-light-background dark:bg-dark-background border font-body text-body-md text-light-on-background dark:text-dark-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition-colors ${
                    errors.confirmPassword
                      ? 'border-error focus-visible:ring-error focus:border-error'
                      : 'border-light-border dark:border-dark-border'
                  }`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) =>
                      val === watch('password') || 'Passwords do not match',
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
          </div>

          {/* Password Strength Visual Meter (3 Bars from Reference) */}
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

          {/* Required Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer mt-1 select-none">
            <input
              type="checkbox"
              className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 border-light-border dark:border-dark-border dark:bg-dark-background"
              {...register('agreeTerms', {
                required: 'You must agree to the guidelines and safety policy',
              })}
            />
            <div className="flex flex-col">
              <span className="font-body text-body-sm text-light-muted dark:text-dark-muted leading-snug">
                I agree to the Khela Hobe Community Guidelines and Safety Policy.
              </span>
              {errors.agreeTerms && (
                <span className="font-body text-xs text-error mt-0.5">
                  {errors.agreeTerms.message}
                </span>
              )}
            </div>
          </label>

          {/* Create Account Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading || isSubmitting}
            className="mt-2 py-3 font-label text-label-lg font-bold"
          >
            Create Account
          </Button>
        </form>

        <div className="relative flex items-center justify-center">
          <span className="h-px flex-1 bg-light-border dark:bg-dark-border" />
          <span className="px-3 text-xs font-label text-light-muted dark:text-dark-muted uppercase">
            Or
          </span>
          <span className="h-px flex-1 bg-light-border dark:bg-dark-border" />
        </div>

        <GoogleSignInButton label="Continue with Google" role={selectedRole} />

        {/* Existing Member Link */}
        <p className="font-body text-body-sm text-light-muted dark:text-dark-muted text-center pt-2 border-t border-light-border dark:border-dark-border">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-label text-label-md font-semibold text-secondary dark:text-primary hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>
      </section>
    </div>
  );
};

export default RegisterPage;
