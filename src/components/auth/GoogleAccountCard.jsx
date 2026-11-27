import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faLinkSlash, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/endpoints/authService';
import { toastService } from '../feedback/toastService';

export const GoogleAccountCard = () => {
  const { user, updateUserState } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);

  const isLinked = Boolean(user?.googleLinked || user?.googleEmail);

  useEffect(() => {
    const linkedFlag = searchParams.get('googleLinked');
    const errorMsg = searchParams.get('googleError');

    if (linkedFlag === '1') {
      authService
        .getCurrentUser()
        .then((freshUser) => {
          if (freshUser) updateUserState(freshUser);
          toastService.success('Google account linked to your profile!');
        })
        .catch(() => {
          toastService.success('Google account linked!');
        });
      searchParams.delete('googleLinked');
      setSearchParams(searchParams, { replace: true });
    } else if (errorMsg) {
      toastService.error(errorMsg);
      searchParams.delete('googleError');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, updateUserState]);

  const handleLinkGoogle = async () => {
    setBusy(true);
    try {
      const { url } = await authService.getGoogleAuthUrl({
        mode: 'link',
        returnTo: location.pathname,
      });
      if (!url) {
        toastService.error('Google linking URL was not returned.');
        setBusy(false);
        return;
      }
      window.location.href = url;
    } catch (err) {
      toastService.error(err?.message || 'Failed to start Google account linking.');
      setBusy(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setBusy(true);
    try {
      const res = await authService.unlinkGoogleAccount();
      if (res?.user) {
        updateUserState(res.user);
      }
      toastService.success('Google account unlinked from your profile.');
    } catch (err) {
      toastService.error(err?.message || 'Unable to unlink Google account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-headline text-title-md font-bold">Google Account</h2>
            {isLinked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-label font-semibold">
                <FontAwesomeIcon icon={faCircleCheck} className="text-[11px]" />
                <span>Linked</span>
              </span>
            )}
          </div>
          <p className="font-body text-body-sm text-light-muted dark:text-dark-muted">
            {isLinked
              ? `Connected to ${user?.googleEmail || user?.email} for one-click sign in.`
              : 'Link your Google account so you can sign in with one click.'}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {isLinked ? (
          <button
            type="button"
            onClick={handleUnlinkGoogle}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-error/40 text-error hover:bg-error/10 font-label text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faLinkSlash} />
            <span>{busy ? 'Unlinking...' : 'Unlink Google'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLinkGoogle}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border hover:border-primary font-label text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faLink} className="text-primary" />
            <span>{busy ? 'Redirecting...' : 'Link Google Account'}</span>
          </button>
        )}
      </div>
    </section>
  );
};

export default GoogleAccountCard;
