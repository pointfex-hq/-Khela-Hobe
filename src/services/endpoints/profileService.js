import apiClient from '../api/apiClient';
import { MOCK_USERS } from '../../mocks/mockData';
import { ROLES } from '../../constants/roles';

// Initial mutable mock data
let playerProfileState = {
  ...MOCK_USERS[ROLES.PLAYER],
  isVerified: true,
  verifiedBadgeText: 'Verified Athlete',
  area: 'Banani / Gulshan, Dhaka North',
  bio: 'Midfielder in 7v7 football and intermediate doubles badminton player. Always happy to bring extra shuttlecocks and match bibs.',
  stats: {
    matchesPlayed: 19,
    matchesOrganized: 14,
    showUpRate: 100,
    reputation: 98,
  },
  sportsPreferences: [
    {
      id: 'sp_1',
      sport: 'Football (Futsal)',
      category: 'Football',
      skillLevel: 'Intermediate',
      preferredPosition: 'Central Midfielder',
      isPrimary: true,
    },
    {
      id: 'sp_2',
      sport: 'Badminton',
      category: 'Badminton',
      skillLevel: 'Advanced',
      preferredFormat: "Men's / Mixed Doubles",
      isPrimary: false,
    },
    {
      id: 'sp_3',
      sport: 'Cricket (Tape Ball)',
      category: 'Cricket',
      skillLevel: 'Recreational',
      preferredPosition: 'All-Rounder',
      isPrimary: false,
    },
  ],
  matchHistory: [
    {
      id: 'hist_1',
      title: 'Banani Turf 5v5',
      date: '15 Nov 2026',
      status: 'Completed',
      role: 'Midfielder',
    },
    {
      id: 'hist_2',
      title: 'Gazipur Indoor Badminton',
      date: '12 Nov 2026',
      status: 'Completed',
      role: 'Doubles Player',
    },
    {
      id: 'hist_3',
      title: 'Uttara Sector 11 7v7',
      date: '08 Nov 2026',
      status: 'Completed',
      role: 'Midfielder',
    },
  ],
  weeklyAvailability: [
    'Weekdays 6:00 PM – 10:00 PM',
    'Friday Morning (7:00 AM – 11:00 AM)',
  ],
  privacy: {
    showGeneralAreaOnly: true,
    hidePhoneUntilAccepted: true,
  },
};

let organizerProfileState = {
  id: 'usr_org_202',
  name: 'Tanvir Hasan',
  email: 'tanvir.org@khelahobe.bd',
  phone: '+880 1711 000111',
  role: ROLES.ORGANIZER,
  city: 'Dhaka',
  area: 'Banani / Gulshan, Dhaka',
  organization: 'North Dhaka Sports Collective',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isVerified: true,
  verifiedBadgeText: 'Verified Organizer',
  bio: 'Organizing competitive and recreational Football, Badminton & Turf events across Dhaka North since 2024. Ensuring safe pitches, referees, and quality bibs.',
  stats: {
    matchesHosted: 42,
    completionRate: 98,
    playerRating: 4.9,
    reputation: 99,
  },
  upcomingMatches: [
    {
      id: 'match_1',
      title: 'Banani Floodlit 7v7 Futsal',
      venue: 'Banani Block F Turf',
      date: 'Today, 7:30 PM BST',
      filledSlots: 11,
      totalSlots: 14,
      type: 'Quick Match • Open Join',
      sport: 'Football',
    },
    {
      id: 'event_corp_cup',
      title: 'Dhaka Corporate Futsal Cup 2026',
      venue: 'Bashundhara Sports Complex',
      date: 'Fri, 28 Nov, 4:00 PM BST',
      filledTeams: 18,
      totalTeams: 24,
      type: 'Future Event',
      sport: 'Football',
    },
  ],
  pastEvents: [
    {
      id: 'past_1',
      title: 'Dhanmondi Friday Morning Cricket',
      date: 'Fri, 14 Nov, 7:00 AM BST',
      attended: '14 / 14 attended',
      status: 'Completed',
    },
    {
      id: 'past_2',
      title: 'Uttara Autumn Badminton Open',
      date: 'Sat, 1 Nov, 5:00 PM BST',
      attended: '32 players',
      status: 'Completed',
    },
  ],
};

/**
 * Profile Management Service
 * Handles Player & Organizer profiles and multipart image uploads.
 */
export const profileService = {
  /**
   * Get player profile by ID
   */
  getPlayerProfile: async (id) => {
    try {
      const response = await apiClient.get(`/profiles/players/${id || 'me'}`);
      return response.data;
    } catch {
      return {
        success: true,
        data: { ...playerProfileState },
      };
    }
  },

  /**
   * Update player profile
   */
  updatePlayerProfile: async (payload) => {
    try {
      const response = await apiClient.put('/profiles/players/me', payload);
      return response.data;
    } catch {
      playerProfileState = {
        ...playerProfileState,
        ...payload,
        stats: {
          ...playerProfileState.stats,
          ...(payload.stats || {}),
        },
      };
      return {
        success: true,
        data: { ...playerProfileState },
        message: 'Profile changes saved successfully.',
      };
    }
  },

  /**
   * Get organizer profile by ID
   */
  getOrganizerProfile: async (id) => {
    try {
      const response = await apiClient.get(`/profiles/organizers/${id || 'me'}`);
      return response.data;
    } catch {
      return {
        success: true,
        data: { ...organizerProfileState },
      };
    }
  },

  /**
   * Update organizer profile
   */
  updateOrganizerProfile: async (payload) => {
    try {
      const response = await apiClient.put('/profiles/organizers/me', payload);
      return response.data;
    } catch {
      organizerProfileState = {
        ...organizerProfileState,
        ...payload,
        stats: {
          ...organizerProfileState.stats,
          ...(payload.stats || {}),
        },
      };
      return {
        success: true,
        data: { ...organizerProfileState },
        message: 'Organizer profile updated successfully.',
      };
    }
  },

  /**
   * Upload profile image with multipart/form-data support
   * Keeps upload logic independent for future backend compatibility.
   */
  uploadProfileImage: async (file) => {
    // Prepare FormData for multipart REST API upload
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await apiClient.post('/profiles/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch {
      // In offline/mock mode, generate local preview URL from file
      const previewUrl = URL.createObjectURL(file);
      playerProfileState.avatar = previewUrl;
      organizerProfileState.avatar = previewUrl;

      return {
        success: true,
        url: previewUrl,
        message: 'Profile picture uploaded successfully.',
      };
    }
  },
};

export default profileService;
