import apiClient from '../api/apiClient';
import { MOCK_USERS } from '../../mocks/mockData';
import { ROLES } from '../../constants/roles';

// In-memory player profile state for mock fallback
let currentPlayerProfile = { ...MOCK_USERS[ROLES.PLAYER] };

export const playerService = {
  /**
   * Get current player's profile data
   */
  getMyProfile: async () => {
    try {
      const response = await apiClient.get('/players/me');
      return response.data;
    } catch {
      return {
        data: { ...currentPlayerProfile },
      };
    }
  },

  /**
   * Update player profile (name, phone, area, bio, sports)
   */
  updateMyProfile: async (payload) => {
    try {
      const response = await apiClient.put('/players/me', payload);
      return response.data;
    } catch {
      currentPlayerProfile = {
        ...currentPlayerProfile,
        ...payload,
      };
      return {
        success: true,
        data: { ...currentPlayerProfile },
        message: 'Profile updated successfully.',
      };
    }
  },

  /**
   * Get participation stats
   */
  getPlayerStats: async () => {
    try {
      const response = await apiClient.get('/players/me/stats');
      return response.data;
    } catch {
      return {
        data: {
          matchesPlayed: currentPlayerProfile.matchesPlayed || 19,
          matchesOrganized: currentPlayerProfile.matchesOrganized || 14,
          showUpRate: currentPlayerProfile.showUpRate || 100,
          reputation: currentPlayerProfile.reputation || 98,
        },
      };
    }
  },

  /**
   * Get player's upcoming matches and schedule
   */
  getPlayerUpcomingSchedule: async () => {
    try {
      const response = await apiClient.get('/players/me/schedule');
      return response.data;
    } catch {
      return {
        data: [
          {
            id: 'match_banani_futsal',
            title: 'Banani 5v5 Evening Run',
            sport: 'Football 7v7',
            schedule: 'Fri, 21 Nov • 7:30 PM',
            role: 'Confirmed Participant',
            status: 'Joined',
            statusVariant: 'success',
          },
          {
            id: 'match_dhanmondi_hoops',
            title: 'Dhanmondi 3x3 Morning Scrimmage',
            sport: 'Basketball',
            schedule: 'Sat, 22 Nov • 6:30 AM',
            role: 'Awaiting Organizer Approval',
            status: 'Pending',
            statusVariant: 'warning',
          },
        ],
      };
    }
  },

  /**
   * Add a new sport preference
   */
  addSportPreference: async (sportData) => {
    try {
      const response = await apiClient.post('/players/me/sports', sportData);
      return response.data;
    } catch {
      const newSport = {
        id: `sp_${Date.now()}`,
        ...sportData,
      };
      currentPlayerProfile.sportsPreferences = [
        ...(currentPlayerProfile.sportsPreferences || []),
        newSport,
      ];
      return {
        success: true,
        data: newSport,
      };
    }
  },

  /**
   * Remove a sport preference
   */
  removeSportPreference: async (sportId) => {
    try {
      const response = await apiClient.delete(`/players/me/sports/${sportId}`);
      return response.data;
    } catch {
      currentPlayerProfile.sportsPreferences = (currentPlayerProfile.sportsPreferences || []).filter(
        (sp) => sp.id !== sportId
      );
      return {
        success: true,
      };
    }
  },
};

export default playerService;
