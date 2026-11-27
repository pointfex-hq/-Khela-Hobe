import apiClient from '../api/apiClient';
import { SPORTS } from '../../constants/sports';
import { unwrapEnvelope, normalizeMatch, normalizeSport } from '../../utils/dtoMappers';

const LANDING_HERO_STATS = [
  { value: 'Live', label: 'Match discovery' },
  { value: 'Verified', label: 'Local turfs & courts' },
  { value: 'Instant', label: 'Quick Match publishing', isHighlight: true },
];

const LANDING_COMMUNITY_BENEFITS = [
  {
    icon: 'bolt',
    title: 'Instant squad fill',
    description:
      'Publish your match parameters and let nearby athletes fill empty slots automatically.',
  },
  {
    icon: 'location',
    title: 'Verified turf locations',
    description: 'Play at local artificial turfs and indoor facilities with confirmed ground details.',
  },
  {
    icon: 'handshake',
    title: 'Equipment coordination',
    description: 'Track who pledges to bring match balls, bibs, and shuttlecocks before kickoff.',
  },
  {
    icon: 'shieldHeart',
    title: 'Guardian oversight',
    description:
      'Parents link accounts with explicit consent to supervise youth participation and safety alerts.',
  },
];

const LANDING_ORGANIZER_BENEFITS = [
  {
    title: 'Publish in two minutes',
    description: 'Create Quick Matches with custom slot caps, entry fees, and rules.',
  },
  {
    title: 'Roster management',
    description: 'Accept or decline applicant requests and manage participant capacity effortlessly.',
  },
  {
    title: 'Digital check-in passes',
    description: 'Verify attendee identities at the pitch and track attendance cleanly.',
  },
  {
    title: 'Zero approval delays',
    description: 'Publish recreational matches immediately without platform bureaucracy.',
  },
];

export const landingService = {
  getHeroStats: async () => ({ data: LANDING_HERO_STATS }),

  getFeaturedSports: async () => {
    try {
      const response = await apiClient.get('/sports');
      const list = unwrapEnvelope(response);
      return { data: Array.isArray(list) && list.length > 0 ? list.map(normalizeSport) : SPORTS };
    } catch {
      return { data: SPORTS };
    }
  },

  getFeaturedMatches: async (params = {}) => {
    const response = await apiClient.get('/matches', {
      params: { page: 0, size: 6, ...(params.sport && params.sport !== 'all' ? { sport: params.sport } : {}) },
    });
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content) ? pageData.content.map(normalizeMatch) : [];
    return { data: list };
  },

  getBenefits: async () => ({
    community: LANDING_COMMUNITY_BENEFITS,
    organizer: LANDING_ORGANIZER_BENEFITS,
  }),

  joinFeaturedMatch: async (matchId) => {
    await apiClient.post(`/matches/${matchId}/join`);
    return { success: true, message: 'Successfully reserved slot in match.' };
  },
};

export default landingService;
