import apiClient from '../api/apiClient';
import { matchService } from './matchService';

export const moderationService = {
  getPendingMatches: async (filters = {}) => {
    const res = await matchService.getMatches({
      includeCancelled: true,
      sport: filters.sport,
      search: filters.search,
      page: filters.page ?? 0,
      size: filters.size ?? 12,
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

    return {
      success: true,
      data: list,
      total: res.total ?? list.length,
      page: res.page ?? 0,
      totalPages: res.totalPages ?? 1,
    };
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
