import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';
import { useAppStore } from '../../store/useAppStore';

export const locationService = {
  getLocations: async (params = {}) => {
    const response = await apiClient.get('/locations', { params });
    const data = unwrapEnvelope(response) || {};
    return {
      success: true,
      zones: Array.isArray(data.zones) ? data.zones : [],
      venues: Array.isArray(data.venues) ? data.venues : [],
    };
  },

  getAdminZones: async () => {
    const response = await apiClient.get('/admin/zones');
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  createZone: async (payload) => {
    const response = await apiClient.post('/admin/zones', payload);
    await useAppStore.getState().invalidateLocations();
    return { success: true, data: unwrapEnvelope(response) };
  },

  updateZone: async (id, payload) => {
    const response = await apiClient.patch(`/admin/zones/${id}`, payload);
    await useAppStore.getState().invalidateLocations();
    return { success: true, data: unwrapEnvelope(response) };
  },

  deleteZone: async (id) => {
    await apiClient.delete(`/admin/zones/${id}`);
    await useAppStore.getState().invalidateLocations();
    return { success: true };
  },

  getAdminVenues: async () => {
    const response = await apiClient.get('/admin/venues');
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  createVenue: async (payload) => {
    const response = await apiClient.post('/admin/venues', payload);
    await useAppStore.getState().invalidateLocations();
    return { success: true, data: unwrapEnvelope(response) };
  },

  updateVenue: async (id, payload) => {
    const response = await apiClient.patch(`/admin/venues/${id}`, payload);
    await useAppStore.getState().invalidateLocations();
    return { success: true, data: unwrapEnvelope(response) };
  },

  deleteVenue: async (id) => {
    await apiClient.delete(`/admin/venues/${id}`);
    await useAppStore.getState().invalidateLocations();
    return { success: true };
  },
};

export default locationService;
