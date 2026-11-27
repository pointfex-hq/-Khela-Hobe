import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Modal from '../modals/Modal';
import Button from '../common/Button';
import { profileService } from '../../services/endpoints/profileService';
import { tokenService } from '../../utils/tokenService';
import { toastService } from '../feedback/toastService';

/**
 * Reusable self-service account deletion panel for Player and Organizer profiles.
 */
export const DeleteAccountCard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      toastService.error('Please type DELETE to confirm permanent deletion.');
      return;
    }
    setDeleting(true);
    try {
      await profileService.deleteMyAccount();
      tokenService.clearTokens();
      toastService.success('Your account and profile have been permanently deleted.');
      window.location.href = '/login';
    } catch (err) {
      toastService.error(err?.message || 'Unable to delete account right now.');
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-error/40 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-error/15 text-error flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div>
            <h2 className="font-headline text-base font-bold text-error">
              Danger Zone — Delete Profile &amp; Account
            </h2>
            <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-0.5">
              Permanently remove your Khela Hobe profile, sessions, and associated activity. This action cannot be undone.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="danger"
          size="sm"
          icon={faTrashCan}
          onClick={() => {
            setConfirmText('');
            setModalOpen(true);
          }}
          className="shrink-0 self-start sm:self-center"
        >
          Delete My Profile
        </Button>
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => !deleting && setModalOpen(false)}
        title="Permanently Delete Account"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmDelete} className="flex flex-col gap-4 py-1">
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
            Deleting your profile will permanently remove your account, login sessions, match/tournament postings, and safety connections.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="font-label text-xs font-semibold">
              Type <span className="font-mono text-error">DELETE</span> to confirm
            </span>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              required
              className="px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-error/50 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-error"
            />
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={deleting}
              disabled={confirmText.trim().toUpperCase() !== 'DELETE'}
            >
              Permanently Delete
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default DeleteAccountCard;
