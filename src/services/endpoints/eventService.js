import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const eventService = {
  getPublicEvents: async (params = {}) => {
    const response = await apiClient.get('/events', { params });
    const list = unwrapEnvelope(response);
    const items = Array.isArray(list?.content) ? list.content : Array.isArray(list) ? list : [];
    return { success: true, data: items, total: items.length };
  },

  getOrganizerEvents: async (statusFilter = 'all') => {
    const response = await apiClient.get('/events/organizer', {
      params: { status: statusFilter },
    });
    const list = unwrapEnvelope(response);
    const items = Array.isArray(list?.content) ? list.content : Array.isArray(list) ? list : [];
    return { success: true, data: items, total: items.length };
  },

  getEventDetails: async (id) => {
    const response = await apiClient.get(`/events/${id}`);
    return { success: true, data: unwrapEnvelope(response) };
  },

  createEvent: async (payload) => {
    const response = await apiClient.post('/events', payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Tournament submitted! It will appear publicly after Admin approval.',
    };
  },

  updateEvent: async (id, payload) => {
    const response = await apiClient.patch(`/events/${id}`, payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Tournament updated successfully.',
    };
  },

  getEventParticipants: async (id) => {
    const response = await apiClient.get(`/events/${id}/participants`);
    const list = unwrapEnvelope(response);
    return {
      success: true,
      data: Array.isArray(list) ? list : [],
      total: Array.isArray(list) ? list.length : 0,
    };
  },

  registerTeam: async (id, payload) => {
    const response = await apiClient.post(`/events/${id}/register`, payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Team registered successfully!',
    };
  },

  getAdminTournaments: async (status = 'ALL') => {
    const response = await apiClient.get('/admin/tournaments', { params: { status } });
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  moderateTournament: async (id, action, note = '') => {
    const response = await apiClient.post(`/admin/tournaments/${id}/moderate`, {
      action,
      note: note || undefined,
    });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message:
        action === 'APPROVE'
          ? 'Tournament approved and published!'
          : 'Tournament rejected with moderation feedback.',
    };
  },

  toggleInterest: async (id) => {
    const response = await apiClient.post(`/events/${id}/interest`);
    return { success: true, data: unwrapEnvelope(response) };
  },

  lookupSafetyPlayer: async (safetyId) => {
    const response = await apiClient.get('/players/lookup-safety', {
      params: { safetyId: safetyId.trim() },
    });
    return { success: true, data: unwrapEnvelope(response) };
  },

  updateRegistration: async (eventId, regId, payload) => {
    const response = await apiClient.patch(`/events/${eventId}/participants/${regId}`, payload);
    return { success: true, data: unwrapEnvelope(response) };
  },

  removeRegistration: async (eventId, regId) => {
    await apiClient.delete(`/events/${eventId}/participants/${regId}`);
    return { success: true };
  },

  updateTournamentResults: async (eventId, payload) => {
    const response = await apiClient.put(`/events/${eventId}/results`, payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Tournament results and leaderboard updated!',
    };
  },
};

export default eventService;
