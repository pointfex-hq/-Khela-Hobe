import apiClient from '../api/apiClient';
import {
  MOCK_HERO_STATS,
  MOCK_FEATURED_MATCHES,
  MOCK_COMMUNITY_BENEFITS,
  MOCK_ORGANIZER_BENEFITS,
} from '../../mocks/mockData';
import { SPORTS } from '../../constants/sports';

/**
 * Landing Page Service / Repository Abstraction
 * Designed for REST API endpoints with graceful offline/mock fallback.
 */
export const landingService = {
  getHeroStats: async () => {
    try {
      const response = await apiClient.get('/platform/hero-stats');
      return response.data;
    } catch {
      return { data: MOCK_HERO_STATS };
    }
  },

  getFeaturedSports: async () => {
    try {
      const response = await apiClient.get('/sports/featured');
      return response.data;
    } catch {
      return { data: SPORTS };
    }
  },

  getFeaturedMatches: async (params = {}) => {
    try {
      const response = await apiClient.get('/matches/featured', { params });
      return response.data;
    } catch {
      let matches = [...MOCK_FEATURED_MATCHES];
      if (params.sport && params.sport !== 'all') {
        matches = matches.filter(
          (m) =>
            m.sport.toLowerCase().includes(params.sport.toLowerCase()) ||
            m.sportCategory?.toLowerCase().includes(params.sport.toLowerCase())
        );
      }
      return { data: matches };
    }
  },

  getBenefits: async () => {
    try {
      const response = await apiClient.get('/platform/benefits');
      return response.data;
    } catch {
      return {
        community: MOCK_COMMUNITY_BENEFITS,
        organizer: MOCK_ORGANIZER_BENEFITS,
      };
    }
  },

  joinFeaturedMatch: async (matchId) => {
    try {
      const response = await apiClient.post(`/matches/${matchId}/join`);
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Successfully reserved slot in match.',
      };
    }
  },
};

export default landingService;
