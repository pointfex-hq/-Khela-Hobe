import apiClient from '../api/apiClient';

// Mock participants store by match ID
const mockParticipantsByMatch = {
  default: [
    {
      id: 'p1',
      name: 'Nusrat Jahan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      experience: 'Competitive • 31 matches',
      skill: 'Competitive',
      matchesPlayed: 31,
      role: 'Organizer',
      status: 'Organizer',
      joinedAt: '18 Nov, 9:00 AM',
      checkedIn: true,
      phone: '+880 1711-223344',
      isHost: true,
    },
    {
      id: 'p2',
      name: 'Tanvir Hasan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      experience: 'Intermediate • 19 matches',
      skill: 'Intermediate',
      matchesPlayed: 19,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '19 Nov, 4:20 PM',
      checkedIn: true,
      phone: '+880 1812-345678',
      isHost: false,
    },
    {
      id: 'p3',
      name: 'Rafiqul Islam',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      experience: 'Competitive • 24 matches',
      skill: 'Competitive',
      matchesPlayed: 24,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '20 Nov, 10:15 AM',
      checkedIn: true,
      phone: '+880 1913-456789',
      isHost: false,
    },
    {
      id: 'p4',
      name: 'Farhan Ahmed',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      experience: 'Intermediate • 22 matches',
      skill: 'Intermediate',
      matchesPlayed: 22,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 11:45 AM',
      checkedIn: true,
      phone: '+880 1614-567890',
      isHost: false,
    },
    {
      id: 'p5',
      name: 'Sadia Rahman',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      experience: 'Intermediate • 14 matches',
      skill: 'Intermediate',
      matchesPlayed: 14,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 1:30 PM',
      checkedIn: false,
      phone: '+880 1515-678901',
      isHost: false,
    },
    {
      id: 'p6',
      name: 'Kazi Arham',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      experience: 'Beginner • 8 matches',
      skill: 'Beginner',
      matchesPlayed: 8,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 2:15 PM',
      checkedIn: false,
      phone: '+880 1716-789012',
      isHost: false,
    },
    {
      id: 'p7',
      name: 'Mehedi Hasan',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      experience: 'Advanced • 45 matches',
      skill: 'Advanced',
      matchesPlayed: 45,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 3:00 PM',
      checkedIn: false,
      phone: '+880 1817-890123',
      isHost: false,
    },
    {
      id: 'p8',
      name: 'Tariqul Islam',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      experience: 'Intermediate • 16 matches',
      skill: 'Intermediate',
      matchesPlayed: 16,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 3:45 PM',
      checkedIn: false,
      phone: '+880 1918-901234',
      isHost: false,
    },
    {
      id: 'p9',
      name: 'Zahid Hossain',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      experience: 'Competitive • 29 matches',
      skill: 'Competitive',
      matchesPlayed: 29,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 4:10 PM',
      checkedIn: false,
      phone: '+880 1619-012345',
      isHost: false,
    },
    {
      id: 'p10',
      name: 'Arman Hossain',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80',
      experience: 'Intermediate • 12 matches',
      skill: 'Intermediate',
      matchesPlayed: 12,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 5:00 PM',
      checkedIn: false,
      phone: '+880 1520-123456',
      isHost: false,
    },
    {
      id: 'p11',
      name: 'Shuvo Roy',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      experience: 'Beginner • 5 matches',
      skill: 'Beginner',
      matchesPlayed: 5,
      role: 'Player',
      status: 'Confirmed',
      joinedAt: '21 Nov, 5:30 PM',
      checkedIn: false,
      phone: '+880 1721-234567',
      isHost: false,
    },
  ],
};

let participantsStore = { ...mockParticipantsByMatch };

export const participantService = {
  /**
   * Get participants for a match
   */
  getMatchParticipants: async (matchId) => {
    try {
      const response = await apiClient.get(`/matches/${matchId}/participants`);
      return response.data;
    } catch {
      const list = participantsStore[matchId] || participantsStore.default;
      return {
        data: [...list],
        total: list.length,
      };
    }
  },

  /**
   * Remove a participant from a match
   */
  removeParticipant: async (matchId, participantId) => {
    try {
      const response = await apiClient.delete(`/matches/${matchId}/participants/${participantId}`);
      return response.data;
    } catch {
      const key = participantsStore[matchId] ? matchId : 'default';
      participantsStore[key] = participantsStore[key].filter((p) => p.id !== participantId);
      return {
        success: true,
        message: 'Participant removed from match roster.',
      };
    }
  },

  /**
   * Check in a participant
   */
  checkInParticipant: async (matchId, participantId) => {
    try {
      const response = await apiClient.post(`/matches/${matchId}/participants/${participantId}/check-in`);
      return response.data;
    } catch {
      const key = participantsStore[matchId] ? matchId : 'default';
      const participant = participantsStore[key].find((p) => p.id === participantId);
      if (participant) {
        participant.checkedIn = true;
      }
      return {
        success: true,
        data: participant,
        message: 'Participant marked as checked-in.',
      };
    }
  },
};

export default participantService;
