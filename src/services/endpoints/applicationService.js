import apiClient from '../api/apiClient';
import { MOCK_APPLICATIONS } from '../../mocks/mockData';

// Mutable in-memory application state for mock fallback
let applicationsList = [...MOCK_APPLICATIONS];

// Mock organizer applicants by match
const mockApplicantsByMatch = {
  default: [
    {
      id: 'app_rev_1',
      matchId: 'match_1',
      matchTitle: 'Uttara Sector 11 Floodlit 7v7',
      sport: 'Football',
      applicantName: 'Farhan Ahmed',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      skill: 'Competitive',
      role: 'Midfielder',
      matchesPlayed: 22,
      location: 'Uttara, Dhaka',
      appliedAt: 'Today at 2:15 PM',
      status: 'pending',
      note: 'Regular midfielder, available for the full 90 mins.',
    },
    {
      id: 'app_rev_2',
      matchId: 'match_1',
      matchTitle: 'Uttara Sector 11 Floodlit 7v7',
      applicantName: 'Sadia Rahman',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      skill: 'Intermediate',
      role: 'Winger',
      matchesPlayed: 14,
      location: 'Banani, Dhaka',
      appliedAt: 'Today at 3:05 PM',
      status: 'pending',
      note: 'Love fast paced turf football. Bringing extra bibs if needed.',
    },
    {
      id: 'app_rev_3',
      matchId: 'match_1',
      matchTitle: 'Uttara Sector 11 Floodlit 7v7',
      applicantName: 'Tariqul Islam',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      skill: 'Intermediate',
      role: 'Defender',
      matchesPlayed: 18,
      location: 'Dhanmondi, Dhaka',
      appliedAt: 'Today at 3:30 PM',
      status: 'pending',
      note: 'Solid defensive anchor looking for weekly weekend matches.',
    },
    {
      id: 'app_rev_4',
      matchId: 'match_2',
      matchTitle: 'Gazipur Evening Badminton Doubles',
      applicantName: 'Kazi Arham',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      skill: 'Intermediate',
      role: 'Player',
      matchesPlayed: 12,
      location: 'Gazipur Sadar',
      appliedAt: 'Yesterday at 6:40 PM',
      status: 'pending',
      note: 'Can bring two feather shuttlecock tubes.',
    },
  ],
};

let organizerApplicants = [...mockApplicantsByMatch.default];

export const applicationService = {
  /**
   * Get all applications for the current player, with optional status filter
   */
  getMyApplications: async (status = 'all') => {
    try {
      const response = await apiClient.get('/applications/my', { params: { status } });
      return response.data;
    } catch {
      let results = [...applicationsList];
      if (status && status !== 'all') {
        results = results.filter((app) => app.status.toLowerCase() === status.toLowerCase());
      }
      return {
        data: results,
        total: results.length,
      };
    }
  },

  /**
   * Get application by ID
   */
  getApplicationById: async (id) => {
    try {
      const response = await apiClient.get(`/applications/${id}`);
      return response.data;
    } catch {
      const app = applicationsList.find((a) => a.id === id);
      return { data: app || null };
    }
  },

  /**
   * Submit an application to a match requiring approval
   */
  submitApplication: async (matchId, payload = {}) => {
    try {
      const response = await apiClient.post(`/matches/${matchId}/applications`, payload);
      return response.data;
    } catch {
      const newApp = {
        id: `app_${Date.now()}`,
        matchId,
        matchTitle: payload.matchTitle || 'Pick-up Match',
        sport: payload.sport || 'Sports',
        venue: payload.venue || 'Venue',
        area: payload.area || 'Dhaka',
        date: payload.date || 'Upcoming',
        time: payload.time || 'TBD',
        organizerName: payload.organizerName || 'Match Organizer',
        appliedAt: 'Just now',
        status: 'pending',
        playerNote: payload.playerNote || 'Excited to play!',
        organizerNote: null,
      };
      applicationsList = [newApp, ...applicationsList];
      return {
        success: true,
        data: newApp,
        message: 'Application submitted successfully. Awaiting organizer approval.',
      };
    }
  },

  /**
   * Withdraw / cancel an application
   */
  withdrawApplication: async (applicationId) => {
    try {
      const response = await apiClient.delete(`/applications/${applicationId}`);
      return response.data;
    } catch {
      const index = applicationsList.findIndex((a) => a.id === applicationId);
      if (index !== -1) {
        applicationsList[index] = {
          ...applicationsList[index],
          status: 'withdrawn',
          organizerNote: 'Withdrawn by player.',
        };
      }
      return {
        success: true,
        message: 'Application withdrawn successfully.',
      };
    }
  },

  /**
   * Get applications for organizer to review
   */
  getOrganizerApplications: async (matchId) => {
    try {
      const response = await apiClient.get('/applications/organizer', { params: { matchId } });
      return response.data;
    } catch {
      let results = [...organizerApplicants];
      if (matchId) {
        results = results.filter((a) => a.matchId === matchId || matchId === 'default');
      }
      return {
        data: results,
        total: results.length,
        pendingCount: results.filter((a) => a.status === 'pending').length,
      };
    }
  },

  /**
   * Approve applicant (increments match roster)
   */
  approveApplication: async (applicationId) => {
    try {
      const response = await apiClient.post(`/applications/${applicationId}/approve`);
      return response.data;
    } catch {
      const appIndex = organizerApplicants.findIndex((a) => a.id === applicationId);
      if (appIndex !== -1) {
        organizerApplicants[appIndex] = {
          ...organizerApplicants[appIndex],
          status: 'accepted',
        };
      }
      return {
        success: true,
        message: 'Applicant accepted and slot reserved successfully.',
      };
    }
  },

  /**
   * Reject applicant
   */
  rejectApplication: async (applicationId, reason = '') => {
    try {
      const response = await apiClient.post(`/applications/${applicationId}/reject`, { reason });
      return response.data;
    } catch {
      const appIndex = organizerApplicants.findIndex((a) => a.id === applicationId);
      if (appIndex !== -1) {
        organizerApplicants[appIndex] = {
          ...organizerApplicants[appIndex],
          status: 'rejected',
          reason,
        };
      }
      return {
        success: true,
        message: 'Application rejected.',
      };
    }
  },
};

export default applicationService;
