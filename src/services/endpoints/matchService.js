import apiClient from '../api/apiClient';
import {
  unwrapEnvelope,
  normalizeMatch,
  normalizeSport,
  toBackendSkillLevel,
} from '../../utils/dtoMappers';
import { useAppStore } from '../../store/useAppStore';

/**
 * Match Discovery and Lifecycle Service — strictly backed by live backend API
 */
export const matchService = {
  getMatches: async (filters = {}) => {
    const params = {
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    };
    if (filters.sportId) params.sportId = filters.sportId;
    if (filters.city && filters.city !== 'All Bangladesh') params.city = filters.city;
    if (filters.status) params.status = filters.status;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (
      filters.skillLevel &&
      filters.skillLevel !== 'all' &&
      filters.skillLevel !== 'Any Level' &&
      filters.skillLevel !== 'Casual'
    ) {
      params.skillLevel = toBackendSkillLevel(filters.skillLevel);
    }

    const response = await apiClient.get('/matches', { params });
    const pageData = unwrapEnvelope(response);
    let results = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeMatch)
      : Array.isArray(pageData)
        ? pageData.map(normalizeMatch)
        : [];

    if (!filters.includeCancelled) {
      results = results.filter((m) => m.state !== 'cancelled' && m.status !== 'CANCELLED');
    }
    if (!filters.sportId && filters.sport && filters.sport !== 'all' && filters.sport !== 'All Sports') {
      results = results.filter(
        (m) =>
          m.sport?.toLowerCase().includes(filters.sport.toLowerCase()) ||
          m.sportCategory?.toLowerCase().includes(filters.sport.toLowerCase())
      );
    }
    if (filters.location && filters.location !== 'all' && filters.location !== 'All Bangladesh') {
      const loc = filters.location.toLowerCase();
      results = results.filter(
        (m) =>
          m.area?.toLowerCase().includes(loc) ||
          m.city?.toLowerCase().includes(loc) ||
          m.venue?.toLowerCase().includes(loc)
      );
    }
    if (filters.date) {
      results = results.filter((m) => m.date === filters.date);
    }
    if (filters.availability === 'Open Slots Only') {
      results = results.filter((m) => m.totalSlots > m.filledSlots && m.joinMode !== 'Match Full');
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.venue?.toLowerCase().includes(q) ||
          m.area?.toLowerCase().includes(q) ||
          m.sport?.toLowerCase().includes(q) ||
          m.organizer?.name?.toLowerCase().includes(q)
      );
    }

    if (filters.sort === 'Most Slots') {
      results.sort((a, b) => (b.totalSlots - b.filledSlots) - (a.totalSlots - a.filledSlots));
    } else if (filters.sort === 'Nearest') {
      results.sort((a, b) => (a.area || '').localeCompare(b.area || ''));
    }

    return {
      success: true,
      data: results,
      total: pageData?.totalElements ?? results.length,
      page: pageData?.page ?? 0,
      totalPages: pageData?.totalPages ?? 1,
    };
  },

  getMatchById: async (id) => {
    const response = await apiClient.get(`/matches/${id}`);
    return { success: true, data: normalizeMatch(unwrapEnvelope(response)) };
  },

  getNearbyMatches: async ({ lat = 23.8103, lng = 90.4125, radiusKm = 25, sportId } = {}) => {
    const params = { lat, lng, radiusKm };
    if (sportId) params.sportId = sportId;
    const response = await apiClient.get('/matches/nearby', { params });
    const list = unwrapEnvelope(response);
    return {
      success: true,
      data: Array.isArray(list) ? list.map(normalizeMatch) : [],
    };
  },

  getMyCreatedMatches: async (statusFilter = 'all', extraParams = {}) => {
    const response = await apiClient.get('/matches/mine', {
      params: {
        status: statusFilter && statusFilter !== 'all' ? statusFilter.toUpperCase() : 'ALL',
        ...extraParams,
      },
    });
    const payload = unwrapEnvelope(response);
    const allMatches = Array.isArray(payload?.content)
      ? payload.content.map(normalizeMatch)
      : Array.isArray(payload)
        ? payload.map(normalizeMatch)
        : [];
    const serverCounts = payload?.counts || {};

    const counts = {
      all: serverCounts.total ?? allMatches.length,
      open: serverCounts.OPEN ?? allMatches.filter((m) => m.state === 'open').length,
      full: serverCounts.FULL ?? allMatches.filter((m) => m.state === 'full').length,
      inProgress: serverCounts.IN_PROGRESS ?? allMatches.filter((m) => m.state === 'in-progress').length,
      completed: serverCounts.COMPLETED ?? allMatches.filter((m) => m.state === 'completed').length,
      cancelled: serverCounts.CANCELLED ?? allMatches.filter((m) => m.state === 'cancelled').length,
    };

    return {
      success: true,
      data: allMatches,
      total: payload?.totalElements ?? allMatches.length,
      page: payload?.page ?? 0,
      totalPages: payload?.totalPages ?? 1,
      counts,
    };
  },

  createMatch: async (payload) => {
    const response = await apiClient.post('/matches', payload);
    const created = normalizeMatch(unwrapEnvelope(response));
    useAppStore.getState().upsertMatchInCache(created);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return {
      success: true,
      data: created,
      message: 'Match created successfully and published immediately.',
    };
  },

  updateMatch: async (id, payload) => {
    const response = await apiClient.patch(`/matches/${id}`, payload);
    const updated = normalizeMatch(unwrapEnvelope(response));
    useAppStore.getState().upsertMatchInCache(updated);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return {
      success: true,
      data: updated,
      message: 'Match details updated successfully.',
    };
  },

  cancelMatch: async (id) => {
    const response = await apiClient.post(`/matches/${id}/cancel`);
    const updated = normalizeMatch(unwrapEnvelope(response));
    if (updated) useAppStore.getState().upsertMatchInCache(updated);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return {
      success: true,
      message: 'Match has been cancelled. Confirmed players have been notified.',
    };
  },

  deleteMatch: async (id) => matchService.cancelMatch(id),

  joinMatch: async (matchId, payload = {}) => {
    if (payload.mode === 'APPLICATION_REQUIRED' || payload.isApprovalRequired) {
      const res = await apiClient.post(`/matches/${matchId}/apply`, {
        message: payload.message || payload.playerNote || '',
      });
      await useAppStore.getState().invalidateMatches({ refetch: true });
      return {
        success: true,
        data: unwrapEnvelope(res),
        message: 'Application submitted to organizer for review.',
      };
    }

    await apiClient.post(`/matches/${matchId}/join`);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return {
      success: true,
      message: 'Successfully joined match! Your slot is reserved.',
    };
  },

  leaveMatch: async (matchId) => {
    await apiClient.post(`/matches/${matchId}/leave`);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return { success: true, message: 'Successfully removed from match roster.' };
  },

  getMatchEquipment: async (matchId) => {
    const response = await apiClient.get(`/matches/${matchId}/equipment`);
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  addMatchEquipment: async (matchId, { name, requiredQuantity = 1 }) => {
    const response = await apiClient.post(`/matches/${matchId}/equipment`, {
      name,
      requiredQuantity: Number(requiredQuantity) || 1,
    });
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return { success: true, data: unwrapEnvelope(response) };
  },

  removeMatchEquipment: async (matchId, itemId) => {
    await apiClient.delete(`/matches/${matchId}/equipment/${itemId}`);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return { success: true };
  },

  pledgeEquipment: async (matchId, { itemId, quantity = 1 }) => {
    const response = await apiClient.post(`/matches/${matchId}/equipment/${itemId}/pledge`, {
      quantity: Number(quantity) || 1,
    });
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Thank you! Your equipment contribution has been saved.',
    };
  },

  unpledgeEquipment: async (matchId, itemId) => {
    const response = await apiClient.delete(`/matches/${matchId}/equipment/${itemId}/pledge`);
    await useAppStore.getState().invalidateMatches({ refetch: true });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Your equipment contribution was withdrawn.',
    };
  },

  getMapMatches: async (coords) => {
    if (coords?.lat && coords?.lng) {
      return matchService.getNearbyMatches(coords);
    }
    return matchService.getMatches();
  },

  getSportsList: async () => {
    const response = await apiClient.get('/sports');
    const list = unwrapEnvelope(response);
    return {
      success: true,
      data: Array.isArray(list) ? list.map(normalizeSport) : [],
    };
  },
};

export default matchService;
