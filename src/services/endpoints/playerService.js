import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeUser, normalizeMatch } from '../../utils/dtoMappers';

export const playerService = {
  getMyProfile: async () => {
    const response = await apiClient.get('/users/me');
    return { success: true, data: normalizeUser(unwrapEnvelope(response)) };
  },

  updateMyProfile: async (payload) => {
    const response = await apiClient.patch('/users/me', payload);
    return {
      success: true,
      data: normalizeUser(unwrapEnvelope(response)),
      message: 'Profile updated successfully.',
    };
  },

  getPlayerStats: async (userId) => {
    if (!userId) {
      return { data: { matchesPlayed: 0, matchesOrganized: 0, showUpRate: 100, reputation: 100 } };
    }
    const response = await apiClient.get(`/users/${userId}/matches`);
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content) ? pageData.content : [];
    const total = pageData?.totalElements ?? list.length;
    const organized = list.filter((m) => m.organizer?.id === userId || m.organizerId === userId).length;
    return {
      data: {
        matchesPlayed: total,
        matchesOrganized: organized,
        showUpRate: 100,
        reputation: 100,
      },
    };
  },

  getPlayerUpcomingSchedule: async (userId) => {
    if (!userId) return { data: [] };

    const response = await apiClient.get(`/users/${userId}/matches`, { params: { page: 0, size: 10 } });
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeMatch)
      : Array.isArray(pageData)
        ? pageData.map(normalizeMatch)
        : [];

    return {
      data: list.map((m) => ({
        id: m.id,
        title: m.title,
        sport: m.sport,
        schedule: m.schedule || m.time || 'Upcoming',
        role: m.organizer?.id === userId ? 'Organizer' : 'Participant',
        status: m.status === 'OPEN' || m.status === 'FULL' ? 'Joined' : m.status,
      })),
    };
  },
};

export default playerService;
