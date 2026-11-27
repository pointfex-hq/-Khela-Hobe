import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const settlementService = {
  getMyLedger: async () => {
    const response = await apiClient.get('/organizer/settlements');
    return {
      success: true,
      data: unwrapEnvelope(response) || {},
    };
  },

  requestSettlement: async (payload) => {
    const response = await apiClient.post('/organizer/settlements', payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Settlement payout request submitted to Admin!',
    };
  },

  adminGetSettlements: async () => {
    const response = await apiClient.get('/admin/settlements');
    return {
      success: true,
      data: unwrapEnvelope(response) || {},
    };
  },

  adminSettleDirect: async (payload) => {
    const response = await apiClient.post('/admin/settlements', payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Organizer settlement completed & fee deducted!',
    };
  },

  adminUpdateSettlement: async (id, payload) => {
    const response = await apiClient.patch(`/admin/settlements/${id}`, payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: `Settlement updated to ${payload.status}!`,
    };
  },
};

export default settlementService;
