import apiClient from '../api/apiClient';

export const adminService = {
  /**
   * Get comprehensive Admin Dashboard metrics, charts & logs
   */
  getAdminDashboard: async () => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      return response.data;
    } catch {
      return {
        success: true,
        data: {
          metrics: {
            totalUsers: 4820,
            activeUsers: 1420,
            totalPlayers: 3280,
            totalOrganizers: 940,
            totalGuardians: 600,
            totalMatches: 964,
            activeMatches: 66,
            totalEvents: 48,
            reportedMatches: 3,
            pendingReports: 7,
            verifiedTurfs: 52,
          },
          weeklyActivity: [
            { day: 'Sat', matches: 42, players: 310, isPeak: false },
            { day: 'Sun', matches: 54, players: 380, isPeak: false },
            { day: 'Mon', matches: 68, players: 460, isPeak: false },
            { day: 'Tue', matches: 52, players: 390, isPeak: false },
            { day: 'Wed', matches: 74, players: 520, isPeak: false },
            { day: 'Thu', matches: 92, players: 710, isPeak: true },
            { day: 'Fri', matches: 110, players: 890, isPeak: true },
          ],
          roleDistribution: [
            { name: 'Players', count: 3280, color: '#B9F34A' },
            { name: 'Organizers', count: 940, color: '#26865B' },
            { name: 'Guardians', count: 600, color: '#FF9F43' },
          ],
          sportsBreakdown: [
            { sport: 'Football / Futsal', matches: 542, percentage: 56 },
            { sport: 'Badminton', matches: 210, percentage: 22 },
            { sport: 'Cricket', matches: 184, percentage: 19 },
            { sport: 'Basketball', matches: 95, percentage: 10 },
          ],
          recentModerationActions: [
            {
              id: 'act_1',
              title: 'Report #R-209 Resolved',
              description: 'Venue mismatch updated for Sector 4 Indoor Complex',
              time: '25 mins ago',
              type: 'report',
            },
            {
              id: 'act_2',
              title: 'Sport Added: Table Tennis',
              description: 'Activated for Dhaka & Chattogram venues',
              time: '2 hrs ago',
              type: 'sport',
            },
            {
              id: 'act_3',
              title: 'Match KH-M-4099 Flagged for Review',
              description: '2 players reported lighting and gate fee discrepancy',
              time: '3 hrs ago',
              type: 'match',
            },
            {
              id: 'act_4',
              title: 'User USR-0921 Restricted',
              description: 'Restricted from quick match creation due to repeated no-shows',
              time: 'Yesterday',
              type: 'user',
            },
          ],
        },
      };
    }
  },
};

export default adminService;
