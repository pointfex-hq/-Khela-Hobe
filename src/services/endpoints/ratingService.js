import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const ratingService = {
  getRatings: async ({ targetUserId, matchId, contextRole } = {}) => {
    const response = await apiClient.get('/ratings', {
      params: {
        targetUserId,
        ...(matchId ? { matchId } : {}),
        ...(contextRole ? { contextRole } : {}),
      },
    });
    return {
      success: true,
      data: unwrapEnvelope(response) || { average: null, count: 0, myRating: null, reviews: [] },
    };
  },

  submitRating: async ({ targetUserId, matchId, contextRole, score, comment }) => {
    const response = await apiClient.post('/ratings', {
      targetUserId,
      ...(matchId ? { matchId } : {}),
      contextRole,
      score: Number(score),
      ...(comment?.trim() ? { comment: comment.trim() } : {}),
    });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: `Rated ${score}/5 stars!`,
    };
  },
};

export default ratingService;
