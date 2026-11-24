import apiClient from '../api/apiClient';

/**
 * Mock analytics data isolated from chart presentation
 */
export const MOCK_ORGANIZER_ANALYTICS = {
  attendanceTrend: [
    { day: 'Mon', players: 14, capacity: 16 },
    { day: 'Tue', players: 8, capacity: 12 },
    { day: 'Wed', players: 22, capacity: 24 },
    { day: 'Thu', players: 12, capacity: 14 },
    { day: 'Fri', players: 28, capacity: 28 },
    { day: 'Sat', players: 36, capacity: 40 },
    { day: 'Sun', players: 30, capacity: 32 },
  ],
  sportBreakdown: [
    { name: 'Football 7v7', matches: 28, fillRate: 94 },
    { name: 'Badminton', matches: 16, fillRate: 98 },
    { name: 'Cricket', matches: 10, fillRate: 88 },
    { name: 'Basketball 3x3', matches: 6, fillRate: 83 },
  ],
  monthlyOverview: [
    { month: 'Jun', hosted: 8, participants: 74 },
    { month: 'Jul', hosted: 12, participants: 110 },
    { month: 'Aug', hosted: 15, participants: 142 },
    { month: 'Sep', hosted: 18, participants: 165 },
    { month: 'Oct', hosted: 22, participants: 210 },
    { month: 'Nov', hosted: 24, participants: 240 },
  ],
  kpis: {
    totalRevenueEstimated: 'BDT 58,400',
    totalCheckIns: 412,
    cancellationRate: '2.1%',
    avgMatchFillRate: '92.4%',
  },
};

export const analyticsService = {
  /**
   * Get analytics metrics for organizer dashboard
   */
  getOrganizerAnalytics: async (timeRange = '7d') => {
    try {
      const response = await apiClient.get('/analytics/organizer', { params: { range: timeRange } });
      return response.data;
    } catch {
      return {
        success: true,
        data: MOCK_ORGANIZER_ANALYTICS,
      };
    }
  },
};

export default analyticsService;
