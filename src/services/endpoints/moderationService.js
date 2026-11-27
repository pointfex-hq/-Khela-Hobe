import apiClient from '../api/apiClient';
import { matchService } from './matchService';

export const moderationService = {
  getPendingMatches: async (filters = {}) => {
    const res = await matchService.getMatches({
      includeCancelled: true,
      sport: filters.sport,
      search: filters.search,
      size: 50,
    });
    const list = (res.data || []).map((m) => ({
      id: m.id,
      title: m.title,
      sport: m.sport,
      venue: m.venue,
      schedule: m.schedule,
      organizerName: m.organizer?.name || 'Organizer',
      organizerId: m.organizer?.id || '',
      status: m.status === 'CANCELLED' ? 'Suspended' : 'Published',
      reportsCount: 0,
      flagReason: null,
      description: m.description,
      rosterCount: `${m.filledSlots} / ${m.totalSlots}`,
    }));

    return { success: true, data: list, total: list.length };
  },

  moderateMatch: async (id, payload) => {
    if (payload.action === 'suspend') {
      await apiClient.post(`/matches/${id}/cancel`);
      return { success: true, message: `Match ${id} suspended.` };
    }
    return { success: true, message: `Match ${id} reviewed.` };
  },
};

export default moderationService;
