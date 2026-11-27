import apiClient from '../api/apiClient';
import { MOCK_MATCHES } from '../../mocks/mockData';
import { SPORTS } from '../../constants/sports';

// In-memory matches store for mock / offline fallback
let matchesStore = [...MOCK_MATCHES];

/**
 * Match Discovery and Lifecycle Service
 * Interfaces with REST API endpoints, with comprehensive offline mock fallback.
 */
export const matchService = {
  /**
   * Fetch matches with filtering, search, and sorting
   */
  getMatches: async (filters = {}) => {
    try {
      const response = await apiClient.get('/matches', { params: filters });
      return response.data;
    } catch {
      let results = [...matchesStore];

      // Exclude cancelled matches from public discovery unless requested
      if (!filters.includeCancelled) {
        results = results.filter((m) => m.state !== 'cancelled' && m.status !== 'CANCELLED');
      }

      // Sport filter
      if (filters.sport && filters.sport !== 'all' && filters.sport !== 'All Sports') {
        results = results.filter((m) =>
          m.sport.toLowerCase().includes(filters.sport.toLowerCase()) ||
          m.sportCategory?.toLowerCase().includes(filters.sport.toLowerCase())
        );
      }

      // Location / Area filter
      if (filters.location && filters.location !== 'all' && filters.location !== 'All Bangladesh') {
        results = results.filter((m) =>
          m.area.toLowerCase().includes(filters.location.toLowerCase()) ||
          m.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          m.venue.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      // Date filter
      if (filters.date) {
        results = results.filter((m) => m.date === filters.date);
      }

      // Skill Level filter
      if (filters.skillLevel && filters.skillLevel !== 'all' && filters.skillLevel !== 'Any Level') {
        results = results.filter((m) =>
          m.skillLevel.toLowerCase().includes(filters.skillLevel.toLowerCase())
        );
      }

      // Availability filter
      if (filters.availability === 'Open Slots Only') {
        results = results.filter((m) => m.totalSlots > m.filledSlots && m.joinMode !== 'Match Full');
      }

      // Search Query
      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter(
          (m) =>
            m.title.toLowerCase().includes(query) ||
            m.venue.toLowerCase().includes(query) ||
            m.area.toLowerCase().includes(query) ||
            m.sport.toLowerCase().includes(query) ||
            m.organizer?.name?.toLowerCase().includes(query)
        );
      }

      // Sorting
      if (filters.sort === 'Nearest') {
        results.sort((a, b) => a.area.localeCompare(b.area));
      } else if (filters.sort === 'Newest') {
        results.sort((a, b) => b.id.localeCompare(a.id));
      } else if (filters.sort === 'Most Slots') {
        results.sort((a, b) => (b.totalSlots - b.filledSlots) - (a.totalSlots - a.filledSlots));
      } else {
        results.sort((a, b) => a.date.localeCompare(b.date));
      }

      return {
        data: results,
        total: results.length,
      };
    }
  },

  /**
   * Get single match by ID
   */
  getMatchById: async (id) => {
    try {
      const response = await apiClient.get(`/matches/${id}`);
      return response.data;
    } catch {
      const match = matchesStore.find((m) => m.id === id) || matchesStore[0];
      return { data: { ...match } };
    }
  },

  /**
   * Get created matches for the organizer
   */
  getMyCreatedMatches: async (statusFilter = 'all') => {
    try {
      const response = await apiClient.get('/matches/created', { params: { status: statusFilter } });
      return response.data;
    } catch {
      let results = [...matchesStore];

      // Attach state flags if missing
      results = results.map((m) => {
        let state = m.state;
        if (!state) {
          if (m.status === 'CANCELLED') state = 'cancelled';
          else if (m.filledSlots >= m.totalSlots) state = 'full';
          else state = 'open';
        }
        return { ...m, state };
      });

      if (statusFilter && statusFilter !== 'all') {
        results = results.filter((m) => m.state === statusFilter);
      }

      return {
        data: results,
        total: results.length,
        counts: {
          all: matchesStore.length,
          open: matchesStore.filter((m) => m.state === 'open' || (!m.state && m.filledSlots < m.totalSlots)).length,
          full: matchesStore.filter((m) => m.state === 'full' || (!m.state && m.filledSlots >= m.totalSlots)).length,
          inProgress: matchesStore.filter((m) => m.state === 'in-progress').length,
          completed: matchesStore.filter((m) => m.state === 'completed').length,
          cancelled: matchesStore.filter((m) => m.state === 'cancelled' || m.status === 'CANCELLED').length,
        },
      };
    }
  },

  /**
   * Create match (organizer action)
   */
  createMatch: async (payload) => {
    try {
      const response = await apiClient.post('/matches', payload);
      return response.data;
    } catch {
      const minP = parseInt(payload.minPlayers, 10) || 2;
      const maxP = parseInt(payload.maxPlayers, 10) || 10;
      const newMatch = {
        id: `match_${Date.now()}`,
        title: payload.title || 'Quick Match',
        sport: payload.sport || 'Football 7v7',
        sportCategory: payload.sportCategory || payload.sport || 'Football',
        venue: payload.venue || 'Local Turf Arena',
        area: payload.area || 'Dhaka',
        city: 'Dhaka',
        coordinates: { x: 340, y: 220, label: payload.area || 'Dhaka' },
        date: payload.date || '2026-11-25',
        schedule: `${payload.date || 'Today'}, ${payload.startTime || '6:00 PM'} (${payload.duration || '90 mins'})`,
        time: `${payload.startTime || '6:00 PM'} – ${payload.endTime || '7:30 PM'}`,
        startTime: payload.startTime || '18:00',
        endTime: payload.endTime || '19:30',
        duration: payload.duration || '90 mins',
        minPlayers: minP,
        totalSlots: maxP,
        filledSlots: 1,
        skillLevel: payload.skillLevel || 'Intermediate',
        joinMode: payload.joinMode || 'Open Join',
        fee: parseInt(payload.fee, 10) || 150,
        surfaceType: payload.surfaceType || 'Standard synthetic turf or court',
        description: payload.description || 'Friendly match. Non-marking footwear and good sportsmanship required.',
        rules: payload.rules || 'Standard recreational guidelines. Arrive 10 minutes prior.',
        state: 'open',
        status: 'ACTIVE',
        organizer: {
          id: 'usr_player_101',
          name: 'Tanvir Hasan',
          rating: 4.9,
          matchesHosted: 15,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        equipment: payload.equipment || [
          { id: 'eq_1', name: 'Match Ball', required: 2, committed: 1, remaining: 1, userPledged: true },
        ],
        participants: [
          {
            id: 'p_host',
            name: 'Tanvir Hasan',
            role: 'Organizer (Host)',
            skill: payload.skillLevel || 'Intermediate',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            joinedAt: 'Just now',
          },
        ],
        image: '/src/assets/images/futsal_night.jpg',
      };

      matchesStore = [newMatch, ...matchesStore];

      return {
        success: true,
        data: newMatch,
        message: 'Match created successfully and published immediately.',
      };
    }
  },

  /**
   * Update existing match
   */
  updateMatch: async (id, payload) => {
    try {
      const response = await apiClient.put(`/matches/${id}`, payload);
      return response.data;
    } catch {
      const index = matchesStore.findIndex((m) => m.id === id);
      if (index !== -1) {
        matchesStore[index] = {
          ...matchesStore[index],
          ...payload,
        };
        return {
          success: true,
          data: matchesStore[index],
          message: 'Match details updated successfully.',
        };
      }
      return { success: false, message: 'Match not found.' };
    }
  },

  /**
   * Cancel match
   */
  cancelMatch: async (id) => {
    try {
      const response = await apiClient.post(`/matches/${id}/cancel`);
      return response.data;
    } catch {
      const index = matchesStore.findIndex((m) => m.id === id);
      if (index !== -1) {
        matchesStore[index] = {
          ...matchesStore[index],
          state: 'cancelled',
          status: 'CANCELLED',
        };
        return {
          success: true,
          message: 'Match has been cancelled. Confirmed players have been notified.',
        };
      }
      return { success: false, message: 'Match not found.' };
    }
  },

  /**
   * Delete match permanently
   */
  deleteMatch: async (id) => {
    try {
      const response = await apiClient.delete(`/matches/${id}`);
      return response.data;
    } catch {
      matchesStore = matchesStore.filter((m) => m.id !== id);
      return {
        success: true,
        message: 'Match deleted successfully.',
      };
    }
  },

  /**
   * Join open match or apply
   */
  joinMatch: async (matchId, payload = {}) => {
    try {
      const response = await apiClient.post(`/matches/${matchId}/join`, payload);
      return response.data;
    } catch {
      const match = matchesStore.find((m) => m.id === matchId);
      if (match) {
        if (match.filledSlots < match.totalSlots) {
          match.filledSlots += 1;
          if (match.filledSlots >= match.totalSlots) {
            match.state = 'full';
          }
        }
      }
      return {
        success: true,
        message: match?.joinMode === 'Approval Required'
          ? 'Application submitted to organizer for review.'
          : 'Successfully joined match! Your slot is reserved.',
      };
    }
  },

  /**
   * Leave match
   */
  leaveMatch: async (matchId) => {
    try {
      const response = await apiClient.post(`/matches/${matchId}/leave`);
      return response.data;
    } catch {
      const match = matchesStore.find((m) => m.id === matchId);
      if (match && match.filledSlots > 0) {
        match.filledSlots -= 1;
        if (match.state === 'full') {
          match.state = 'open';
        }
      }
      return {
        success: true,
        message: 'Successfully removed from match roster.',
      };
    }
  },

  /**
   * Pledge equipment items for a match
   */
  pledgeEquipment: async (matchId, { itemId, quantity = 1 }) => {
    try {
      const response = await apiClient.post(`/matches/${matchId}/equipment/${itemId}/pledge`, { quantity });
      return response.data;
    } catch {
      const match = matchesStore.find((m) => m.id === matchId);
      if (match) {
        const item = match.equipment?.find((e) => e.id === itemId);
        if (item) {
          item.committed = Math.min(item.required, item.committed + quantity);
          item.remaining = Math.max(0, item.required - item.committed);
          item.userPledged = true;
        }
      }
      return {
        success: true,
        message: 'Thank you! Your equipment pledge has been logged for this match.',
      };
    }
  },

  /**
   * Get matches formatted for Map View
   */
  getMapMatches: async () => {
    try {
      const response = await apiClient.get('/matches/map');
      return response.data;
    } catch {
      return {
        data: matchesStore.map((m) => ({
          id: m.id,
          title: m.title,
          sport: m.sport,
          venue: m.venue,
          area: m.area,
          coordinates: m.coordinates,
          schedule: m.schedule,
          slotsLeft: m.totalSlots - m.filledSlots,
          joinMode: m.joinMode,
          fee: m.fee,
          image: m.image,
        })),
      };
    }
  },

  /**
   * Sports catalog
   */
  getSportsList: async () => {
    try {
      const response = await apiClient.get('/sports');
      return response.data;
    } catch {
      return { data: SPORTS };
    }
  },
};

export default matchService;
