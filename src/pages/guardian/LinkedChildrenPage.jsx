import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faShieldHalved,
  faPlus,
  faCircleCheck,
  faClock,
  faBan,
  faEye,
  faCheck,
  faLock,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { childService } from '../../services/endpoints/childService';
import { useAuth } from '../../hooks/useAuth';
import { toastService } from '../../components/feedback/toastService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ConfirmationDialog from '../../components/feedback/ConfirmationDialog';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

export const LinkedChildrenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safetyIdInput, setSafetyIdInput] = useState('');
  const [relationshipInput, setRelationshipInput] = useState('Son');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSentMsg, setLinkSentMsg] = useState(false);

  // Dialog state for unlinking/canceling
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    childId: null,
    childName: '',
    actionType: 'revoke', // 'revoke' or 'cancel'
  });

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await childService.getLinkedChildren();
      if (res.success) {
        setChildren(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleSendLinkRequest = async (e) => {
    e.preventDefault();
    const cleanId = safetyIdInput.trim().toUpperCase();
    if (!cleanId) {
      toastService.error('Please enter a valid Child Safety ID.');
      return;
    }

    if (user?.safetyId && cleanId === String(user.safetyId).trim().toUpperCase()) {
      toastService.error('You cannot enter your own Safety ID to link to your own account.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await childService.linkChild({
        safetyId: cleanId,
        relationship: relationshipInput,
      });

      if (res.success) {
        setLinkSentMsg(true);
        toastService.success(res.message || 'Child linking request initiated successfully.');
        setSafetyIdInput('');
        fetchChildren();
      }
    } catch {
      toastService.error('Failed to initiate child linking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (child, actionType) => {
    setDialogState({
      isOpen: true,
      childId: child.id,
      childName: child.name,
      actionType,
    });
  };

  const handleConfirmAction = async () => {
    if (!dialogState.childId) return;

    try {
      const res = await childService.unlinkChild(dialogState.childId);
      if (res.success) {
        toastService.success(
          dialogState.actionType === 'revoke'
            ? 'Child relationship revoked successfully.'
            : 'Pending linking request cancelled.'
        );
        fetchChildren();
      }
    } catch {
      toastService.error('Failed to complete action.');
    } finally {
      setDialogState({ isOpen: false, childId: null, childName: '', actionType: 'revoke' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading linked youth profiles..." />
      </div>
    );
  }

  const authorizedList = children.filter((c) => c.status === 'Authorized' || c.isVerified);
  const pendingList = children.filter((c) => c.status !== 'Authorized' && !c.isVerified);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-light-on-background dark:text-dark-on-background">
              Linked Children
            </h1>
            <Badge variant="success" size="sm" hasDot>
              Authorized Guardian
            </Badge>
          </div>
          <p className="font-body text-sm text-light-muted dark:text-dark-muted mt-1">
            Manage authorized youth accounts, start new linking requests, and review access permissions.
          </p>
        </div>
      </div>

      {/* Initiate Linking Form (Safety ID initiation-only rule) */}
      <section className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faLock} className="text-primary text-sm" />
            <h2 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
              Start a Child Linking Request
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-light-muted dark:text-dark-muted">
            Enter your child&apos;s Safety ID to send a linking request. A Safety ID only initiates
            verification—no activity is visible until the child approves and backend authorization completes.
          </p>
        </div>

        <form onSubmit={handleSendLinkRequest} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="safetyIdInput" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
              Child Safety ID
            </label>
            <input
              id="safetyIdInput"
              type="text"
              value={safetyIdInput}
              onChange={(e) => setSafetyIdInput(e.target.value)}
              placeholder="e.g., KH-SID-84920"
              className="w-full px-3.5 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-light-on-surface dark:text-dark-on-surface uppercase"
            />
          </div>

          <div className="w-full sm:w-44 flex flex-col gap-1.5">
            <label htmlFor="relationshipInput" className="font-label text-xs font-semibold text-light-on-surface dark:text-dark-on-surface">
              Relationship
            </label>
            <select
              id="relationshipInput"
              value={relationshipInput}
              onChange={(e) => setRelationshipInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-light-on-surface dark:text-dark-on-surface"
            >
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
              <option value="Ward">Ward</option>
              <option value="Sibling">Dependent Sibling</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            icon={faPlus}
            className="shrink-0"
          >
            Send Link Request
          </Button>
        </form>

        {linkSentMsg && (
          <div className="p-3 rounded-md bg-success/10 border border-success/30 flex items-center gap-2 text-success font-body text-xs">
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
            <span>Linking request initiated. Awaiting child confirmation and backend verification.</span>
          </div>
        )}
      </section>

      {/* Linked Accounts Grid */}
      <section className="flex flex-col gap-4">
        <h2 className="font-headline font-bold text-xl text-light-on-surface dark:text-dark-on-surface">
          Authorized &amp; Pending Young Athletes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authorized Children */}
          {authorizedList.map((child) => (
            <article
              key={child.id}
              className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-sm"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                      {child.name}
                    </h3>
                    <p className="font-body text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      Age {child.age || 15} • {child.area || 'Uttara Sector 7'} •{' '}
                      {child.sports?.join(' & ') || 'Football'}
                    </p>
                  </div>
                  <Badge variant="success" size="sm" hasDot>
                    Authorized
                  </Badge>
                </div>

                <div className="rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border p-3.5 flex flex-col gap-1.5 font-body text-xs">
                  <p>
                    <strong className="text-light-on-surface dark:text-dark-on-surface">Permissions:</strong>{' '}
                    {child.permissions || 'Match schedules, public venue names, organizer check-in alerts'}
                  </p>
                  <p className="text-light-muted dark:text-dark-muted flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLock} className="text-[10px] text-primary" />
                    <span>{child.privacyNote || 'Exact residential coordinates are never stored or shared.'}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  icon={faEye}
                  onClick={() => navigate(`/guardian/children/${child.id}/activity`)}
                >
                  Open Activity
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="!text-error !border-error hover:!bg-error/10"
                  icon={faBan}
                  onClick={() => openConfirmDialog(child, 'revoke')}
                >
                  Request Revocation
                </Button>
              </div>
            </article>
          ))}

          {/* Pending Children */}
          {pendingList.map((req) => (
            <article
              key={req.id}
              className="rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-sm opacity-90"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-light-on-surface dark:text-dark-on-surface">
                      {req.name}
                    </h3>
                    <p className="font-mono text-xs text-light-muted dark:text-dark-muted mt-0.5">
                      Safety ID: {req.safetyId}
                    </p>
                  </div>
                  <Badge variant="warning" size="sm" hasDot>
                    Pending Verification
                  </Badge>
                </div>

                <div className="rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border p-3.5 font-body text-xs text-light-muted dark:text-dark-muted flex items-start gap-2">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-warning text-xs mt-0.5 shrink-0" />
                  <span>
                    Child details and match activity remain hidden until the account holder confirms this guardian link.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-light-border dark:border-dark-border flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openConfirmDialog(req, 'cancel')}
                >
                  Cancel Request
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, childId: null, childName: '', actionType: 'revoke' })}
        onConfirm={handleConfirmAction}
        title={
          dialogState.actionType === 'revoke'
            ? `Revoke Link for ${dialogState.childName}?`
            : `Cancel Linking Request?`
        }
        message={
          dialogState.actionType === 'revoke'
            ? 'This will immediately disconnect guardian oversight and hide all match activities for this account. You will need to reissue a Safety ID to re-link.'
            : 'Are you sure you want to cancel this pending linking request? The child will not receive further notifications.'
        }
        confirmText={dialogState.actionType === 'revoke' ? 'Revoke Link' : 'Confirm Cancellation'}
        confirmVariant="danger"
      />
    </div>
  );
};

export default LinkedChildrenPage;
