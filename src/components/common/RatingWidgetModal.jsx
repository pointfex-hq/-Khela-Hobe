import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Modal from '../modals/Modal';
import Button from './Button';
import { ratingService } from '../../services/endpoints/ratingService';
import { toastService } from '../feedback/toastService';

export const StarSummaryBadge = ({ average, count = 0, label = '' }) => {
  if (!count && !average) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-light-muted dark:text-dark-muted">
        <FontAwesomeIcon icon={faStar} className="text-[11px] opacity-40" />
        <span>No ratings yet</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
      <FontAwesomeIcon icon={faStar} className="text-[11px]" />
      <span className="tabular-nums">{Number(average).toFixed(1)}</span>
      <span className="text-light-muted dark:text-dark-muted font-normal tabular-nums">
        ({count}{label ? ` ${label}` : ''})
      </span>
    </span>
  );
};

export const RatingWidgetModal = ({
  isOpen,
  onClose,
  targetUserId,
  targetName,
  matchId,
  contextRole, // 'PLAYER_TO_ORGANIZER' | 'ORGANIZER_TO_PLAYER'
  onSubmitted,
}) => {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !targetUserId) return;
    setScore(5);
    setHoverScore(0);
    setComment('');
    ratingService
      .getRatings({ targetUserId, matchId, contextRole })
      .then((res) => {
        if (res?.data?.myRating) {
          setScore(res.data.myRating.score || 5);
          setComment(res.data.myRating.comment || '');
        }
      })
      .catch(() => {});
  }, [isOpen, targetUserId, matchId, contextRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUserId) return;
    setSubmitting(true);
    try {
      const res = await ratingService.submitRating({
        targetUserId,
        matchId,
        contextRole,
        score,
        comment,
      });
      toastService.success(res.message || 'Rating submitted!');
      if (onSubmitted) onSubmitted(res.data);
      onClose();
    } catch (err) {
      toastService.error(err?.message || 'Unable to save rating.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayScore = hoverScore || score;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rate ${targetName || (contextRole === 'PLAYER_TO_ORGANIZER' ? 'Organizer' : 'Player')}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-light-surface-elevated dark:bg-dark-surface-elevated border border-light-border dark:border-dark-border">
          <span className="font-label text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted">
            Select Star Rating
          </span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverScore(star)}
                onMouseLeave={() => setHoverScore(0)}
                onClick={() => setScore(star)}
                className="p-1.5 transition-transform hover:scale-110"
                aria-label={`${star} star`}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className={`text-2xl ${
                    star <= displayScore
                      ? 'text-warning'
                      : 'text-light-border dark:text-dark-border'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="font-headline font-bold text-sm text-primary">
            {displayScore} / 5 Stars
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-label text-xs font-semibold">Review / Feedback (Optional)</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              contextRole === 'PLAYER_TO_ORGANIZER'
                ? 'Comment on turf organization, kickoff punctuality, and fair play...'
                : 'Comment on sportsmanship, punctuality, and teamwork...'
            }
            className="w-full px-3 py-2 rounded-md bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            Submit Rating
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RatingWidgetModal;
