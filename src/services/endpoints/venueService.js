import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const venueService = {
  getVenues: async (params = {}) => {
    const response = await apiClient.get('/venues', { params });
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content)
      ? pageData.content
      : Array.isArray(pageData)
        ? pageData
        : [];
    return { success: true, data: list, total: pageData?.totalElements ?? list.length };
  },

  getVenueById: async (id) => {
    const response = await apiClient.get(`/venues/${id}`);
    return { success: true, data: unwrapEnvelope(response) };
  },

  createVenue: async (payload) => {
    const response = await apiClient.post('/venues', payload);
    return { success: true, data: unwrapEnvelope(response) };
  },

  getMyVenues: async () => {
    const response = await apiClient.get('/venues/mine');
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },
};

export default venueService;
