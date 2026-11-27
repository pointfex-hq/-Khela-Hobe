import { applicationService } from './applicationService';
import { matchService } from './matchService';

export const organizerService = {
  getOrganizerDashboard: async (organizerId = null) => {
    const res = await matchService.getMyCreatedMatches('all', organizerId);
    const matches = res.data || [];
    const counts = res.counts || {};
    const totalParticipants = matches.reduce((sum, m) => sum + (m.filledSlots || 0), 0);

    return {
      success: true,
      data: {
        metrics: {
          totalCreated: counts.all ?? matches.length,
          upcoming: counts.open ?? 0,
          active: (counts.open ?? 0) + (counts.inProgress ?? 0),
          completed: counts.completed ?? 0,
          participants: totalParticipants,
          pendingApps: 0,
        },
        activeMatches: matches,
        pendingAlert: null,
      },
    };
  },

  getPendingApplications: async (matchId) => {
    try {
      return await applicationService.getOrganizerApplications(matchId);
    } catch {
      return { success: true, data: [] };
    }
  },

  reviewApplication: async (id, decision, reason = '', matchId) => {
    if (decision === 'accept' || decision === 'approve') {
      return await applicationService.approveApplication(id, matchId);
    }
    return await applicationService.rejectApplication(id, reason, matchId);
  },
};

export default organizerService;
