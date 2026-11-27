import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeParticipant } from '../../utils/dtoMappers';

export const participantService = {
  getMatchParticipants: async (matchId) => {
    const response = await apiClient.get(`/matches/${matchId}/participants`);
    const list = unwrapEnvelope(response);
    const normalized = Array.isArray(list) ? list.map(normalizeParticipant) : [];
    return {
      success: true,
      data: normalized,
      total: normalized.length,
    };
  },

  removeParticipant: async (matchId, participantId) => {
    await apiClient.delete(`/matches/${matchId}/participants/${participantId}`);
    return { success: true, message: 'Participant removed from match roster.' };
  },

  checkInParticipant: async (matchId, participantId) => {
    const response = await apiClient.post(
      `/matches/${matchId}/participants/${participantId}/check-in`
    );
    return {
      success: true,
      data: normalizeParticipant(unwrapEnvelope(response)),
      message: 'Participant marked as checked-in.',
    };
  },

  toggleNoShow: async (matchId, participantId, noShow = true) => {
    const response = await apiClient.post(
      `/matches/${matchId}/participants/${participantId}/no-show`,
      { noShow }
    );
    return {
      success: true,
      data: normalizeParticipant(unwrapEnvelope(response)),
      message: noShow
        ? 'Marked as "Did Not Show Up". Player show-up rate updated.'
        : 'Player attendance restored to Confirmed.',
    };
  },
};

export default participantService;
