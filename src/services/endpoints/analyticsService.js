import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const analyticsService = {
  getOrganizerAnalytics: async (timeRange = '7d') => {
    try {
      const response = await apiClient.get('/analytics/organizer', { params: { range: timeRange } });
      return { success: true, data: unwrapEnvelope(response) };
    } catch {
      return {
        success: true,
        data: {
          attendanceTrend: [],
          sportBreakdown: [],
          monthlyOverview: [],
          kpis: {},
        },
      };
    }
  },
};

export default analyticsService;
