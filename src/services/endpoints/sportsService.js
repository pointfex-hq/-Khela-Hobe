import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeSport } from '../../utils/dtoMappers';
import { useAppStore } from '../../store/useAppStore';

export const sportsService = {
  getSports: async () => {
    const response = await apiClient.get('/sports');
    const list = unwrapEnvelope(response);
    const normalized = Array.isArray(list) ? list.map(normalizeSport) : [];
    return {
      success: true,
      data: normalized,
      total: normalized.length,
    };
  },

  createSport: async (payload) => {
    const dto = {
      name: payload.name,
      slug:
        payload.slug ||
        payload.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      iconUrl: payload.iconUrl || '⚽',
      description: payload.description || undefined,
      playerCountMin: payload.playerCountMin ?? 2,
      playerCountMax: payload.playerCountMax ?? (parseInt(payload.defaultCapacity, 10) || 14),
    };

    const response = await apiClient.post('/admin/sports', dto);
    const created = normalizeSport(unwrapEnvelope(response));
    await useAppStore.getState().invalidateSports();
    return {
      success: true,
      data: created,
      message: `Sport "${created.name}" created successfully.`,
    };
  },

  updateSport: async (id, payload) => {
    const dto = {
      name: payload.name,
      iconUrl: payload.iconUrl,
      description: payload.description,
      playerCountMin: payload.playerCountMin,
      playerCountMax: payload.playerCountMax ?? (parseInt(payload.defaultCapacity, 10) || undefined),
      active: payload.status ? payload.status === 'Active' : payload.active,
    };
    const response = await apiClient.patch(`/admin/sports/${id}`, dto);
    const updated = normalizeSport(unwrapEnvelope(response));
    await Promise.all([
      useAppStore.getState().invalidateSports(),
      useAppStore.getState().invalidateMatches({ refetch: true }),
    ]);
    return {
      success: true,
      data: updated,
      message: `Sport "${updated.name}" updated successfully.`,
    };
  },

  deleteSport: async (id) => {
    await apiClient.delete(`/admin/sports/${id}`);
    await useAppStore.getState().invalidateSports();
    return { success: true, message: 'Sport removed from platform catalog.' };
  },
};

export default sportsService;
