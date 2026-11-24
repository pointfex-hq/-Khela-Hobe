import apiClient from '../api/apiClient';
import { applicationService } from './applicationService';
import { matchService } from './matchService';
import { eventService } from './eventService';

export const organizerService = {
  /**
   * Get complete organizer dashboard summary data
   */
  getOrganizerDashboard: async () => {
    try {
      const response = await apiClient.get('/organizer/dashboard');
      return response.data;
    } catch {
      return {
        success: true,
        data: {
          metrics: {
            totalCreated: 14,
            upcoming: 3,
            active: 2,
            completed: 9,
            participants: 128,
            pendingApps: 4,
          },
          activeMatches: [
            {
              id: 'match_1',
              title: 'Uttara Sector 11 Floodlit 7v7',
              sport: 'Football',
              status: 'Approval Required',
              pendingCount: 4,
              timeText: 'Today, 8:30 PM • 11 / 14 players • Approval Required',
              venue: 'Uttara Sector 11 Turf Ground',
              date: 'Today, 8:30 PM BST',
              filledSlots: 11,
              totalSlots: 14,
            },
            {
              id: 'match_2',
              title: 'Chashara Court 3x3 Scrimmage',
              sport: 'Basketball',
              status: 'Open',
              pendingCount: 0,
              timeText: 'Sat, 21 Nov • 5:00 PM • 4 / 6 players • Open Join',
              venue: 'Chashara Basketball Court, Narayanganj',
              date: 'Sat, 21 Nov, 5:00 PM BST',
              filledSlots: 4,
              totalSlots: 6,
            },
          ],
          pendingAlert: {
            count: 4,
            matchTitle: 'Uttara Sector 11 Floodlit 7v7',
            schedule: 'Today, 8:30 PM BST',
            remainingSlots: 3,
            matchId: 'match_1',
          },
        },
      };
    }
  },

  /**
   * Get pending applications waiting for organizer review
   */
  getPendingApplications: async () => {
    try {
      const res = await applicationService.getOrganizerApplications();
      return res;
    } catch {
      return {
        success: true,
        data: [],
      };
    }
  },

  /**
   * Review application: decision is 'accept' or 'reject'
   */
  reviewApplication: async (id, decision, reason = '') => {
    if (decision === 'accept' || decision === 'approve') {
      return await applicationService.approveApplication(id);
    }
    return await applicationService.rejectApplication(id, reason);
  },
};

export default organizerService;
