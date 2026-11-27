import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const equipmentService = {
  getEquipment: async () => {
    const response = await apiClient.get('/equipment');
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  getMyEquipment: async () => {
    const response = await apiClient.get('/equipment/mine');
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  createEquipment: async (payload) => {
    const response = await apiClient.post('/equipment', payload);
    return { success: true, data: unwrapEnvelope(response) };
  },

  deleteEquipment: async (id) => {
    await apiClient.delete(`/equipment/${id}`);
    return { success: true };
  },
};

export default equipmentService;
