import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const chatService = {
  getMessages: async (matchId, { mode = 'dm', withUserId } = {}) => {
    const params = { mode };
    if (withUserId) params.withUserId = withUserId;
    const response = await apiClient.get(`/matches/${matchId}/messages`, { params });
    return {
      success: true,
      data: unwrapEnvelope(response),
    };
  },

  sendMessage: async (matchId, { content, mode = 'dm', recipientId } = {}) => {
    const response = await apiClient.post(`/matches/${matchId}/messages`, {
      content,
      mode,
      ...(recipientId ? { recipientId } : {}),
    });
    return {
      success: true,
      data: unwrapEnvelope(response),
    };
  },
};

export default chatService;
