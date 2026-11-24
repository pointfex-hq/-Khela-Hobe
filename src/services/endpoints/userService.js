import apiClient from '../api/apiClient';
import { MOCK_NOTIFICATIONS } from '../../mocks/mockData';

let usersStore = [
  {
    id: 'USR-1042',
    name: 'Tanvir Hasan',
    email: 'tanvir@khelahobe.com',
    phone: '+880 1711-234567',
    avatar:
      'https://lh3.googleusercontent.com/aida/ALJJyrDpYAgpYST1dl8o6QMzQYBWv5ow6VVhizL5_LLubh5M9HFfGSC5ymnRd5wYlBKp_Q7BmrzxAIu8gqQbUVSYaFXR_0E3yfKnlYUBAqqjZjukjpUA1LIqEeXGrd9Jq-vx3EtZSVRNpcsI8Rcf6VQ1-EHjOaEi4dhh9Vm4I71pY3sAG23yMPyCBYAChvpmAwzvVqeaFzIZpqR2jhCSbXN3HBDpepUJP1tOR2C6PRu_arAIg98YSWddOg',
    roles: ['Player', 'Organizer'],
    primaryRole: 'Player',
    area: 'Banani, Dhaka',
    status: 'Active',
    reportsCount: 0,
    matchesPlayed: 34,
    matchesHosted: 12,
    joinedDate: '15 Jan 2026',
    bio: 'Competitive futsal winger and community weekend tournament coordinator.',
  },
  {
    id: 'USR-1189',
    name: 'Nusrat Jahan',
    email: 'nusrat@khelahobe.com',
    phone: '+880 1819-876543',
    avatar:
      'https://lh3.googleusercontent.com/aida/ALJJyrCPK3Kv5APimUihOInV8a4luOaGIqGI5AAxehXXSJ5OVU797eIqHmKH6cWfGMAq-yxJj7E8Lapgw8HpH-m8ExuOQ45HluuHLQsl-z-ZVIRC0QpdRV8t2nLy_FLgV9pDdcvjBNhi3i9jJnvARB1RTzc05lwa9FbXPr4M058ZQiQ1Xhzb4DMRxUTwnJYSeNFpOwvWkQfS-nSBzLjBz3bRb07OM5t_a79iYIuk55kBeaPM_-f45lGr',
    roles: ['Player', 'Guardian'],
    primaryRole: 'Guardian',
    area: 'Uttara, Dhaka',
    status: 'Active',
    reportsCount: 0,
    matchesPlayed: 18,
    matchesHosted: 0,
    joinedDate: '02 Feb 2026',
    bio: 'Guardian account supervising junior athlete training and badminton sessions.',
  },
  {
    id: 'USR-0921',
    name: 'Mahmudul Karim',
    email: 'mahmudul@gmail.com',
    phone: '+880 1612-445566',
    avatar: null,
    initials: 'MK',
    roles: ['Player'],
    primaryRole: 'Player',
    area: 'Dhanmondi, Dhaka',
    status: 'Restricted',
    reportsCount: 2,
    matchesPlayed: 8,
    matchesHosted: 1,
    joinedDate: '19 Mar 2026',
    bio: 'Weekend badminton and cricket enthusiast.',
  },
  {
    id: 'USR-0844',
    name: 'Rafiqul Islam',
    email: 'rafiqul@turfhub.com',
    phone: '+880 1914-998877',
    avatar:
      'https://lh3.googleusercontent.com/aida/ALJJyrAcOLHnTqaMK7l_INjFcE6XLptPWUg9KAnupfPU-ZI_oSk6hGILrid7-l966l4_yYiqQuUaxZORVNqafOKtJdqXKO5f7NEqfRdLB6i_YUYfEMPremX568Et5ZMv4XPyBzcsBmu2LjJ3xMmVV85B1-5SMIZUybQ0g6CIo0aDVjYTe7EUsKr9frXkxdUcqgAHMYe91fPtnlGpbb42xdUPlfzlY5D47CRny7J4bu1yH-dyc4rEcGlc',
    roles: ['Organizer'],
    primaryRole: 'Organizer',
    area: 'Bashundhara, Dhaka',
    status: 'Active',
    reportsCount: 1,
    matchesPlayed: 2,
    matchesHosted: 45,
    joinedDate: '10 Nov 2025',
    bio: 'Certified turf manager and organizer for corporate futsal leagues.',
  },
  {
    id: 'USR-0752',
    name: 'Shahriar Kabir',
    email: 'shahriar@yahoo.com',
    phone: '+880 1515-332211',
    avatar: null,
    initials: 'SK',
    roles: ['Player'],
    primaryRole: 'Player',
    area: 'Mirpur, Dhaka',
    status: 'Suspended',
    reportsCount: 4,
    matchesPlayed: 14,
    matchesHosted: 2,
    joinedDate: '04 Apr 2026',
    bio: 'Account currently suspended due to policy violations.',
  },
];

export const userService = {
  /**
   * Get filtered user directory for admin management
   */
  getUsers: async (filters = {}) => {
    try {
      const response = await apiClient.get('/admin/users', { params: filters });
      return response.data;
    } catch {
      let results = [...usersStore];
      const { search, role, status } = filters;

      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        results = results.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.id.toLowerCase().includes(query) ||
            u.area.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
      }

      if (role && role !== 'All Roles') {
        results = results.filter((u) => u.roles.some((r) => r.toLowerCase() === role.toLowerCase()));
      }

      if (status && status !== 'All Statuses') {
        results = results.filter((u) => u.status.toLowerCase() === status.toLowerCase());
      }

      return {
        success: true,
        data: results,
        total: results.length,
      };
    }
  },

  /**
   * Get single user by ID
   */
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/admin/users/${id}`);
      return response.data;
    } catch {
      const user = usersStore.find((u) => u.id.toLowerCase() === id.toLowerCase());
      return {
        success: Boolean(user),
        data: user || null,
      };
    }
  },

  /**
   * Update user moderation status (Active, Restricted, Suspended)
   */
  updateUserStatus: async (id, payload) => {
    try {
      const response = await apiClient.patch(`/admin/users/${id}/status`, payload);
      return response.data;
    } catch {
      const user = usersStore.find((u) => u.id.toLowerCase() === id.toLowerCase());
      if (user) {
        user.status = payload.status || user.status;
        if (payload.action === 'restrict') user.status = 'Restricted';
        if (payload.action === 'suspend') user.status = 'Suspended';
        if (payload.action === 'reactivate') user.status = 'Active';
      }
      return {
        success: true,
        data: user,
        message: `User ${user?.name || id} status updated to ${user?.status}.`,
      };
    }
  },

  /**
   * User notification & profile helpers (backward compatibility)
   */
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/users/notifications');
      return response.data;
    } catch {
      return { data: MOCK_NOTIFICATIONS };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch {
      return { success: true, data: profileData };
    }
  },
};

export default userService;
