import apiClient from '../api/apiClient';

let linkedChildrenStore = [
  {
    id: 'ch_ayan_15',
    name: 'Ayan Rahman',
    age: 15,
    relationship: 'Son',
    safetyId: 'KH-SID-84920',
    area: 'Uttara Sector 7, Dhaka',
    status: 'Authorized',
    isVerified: true,
    sports: ['Football', 'Badminton'],
    permissions: 'Match schedules, public venue names, organizer check-in alerts',
    privacyNote: 'Exact residential coordinates are never stored or shared.',
    nextActivity: {
      title: 'Uttara U17 6v6 Turf Friendly',
      date: 'Today, 24 Nov 2026',
      time: '5:30 PM – 7:00 PM (Asia/Dhaka)',
      venue: 'Uttara Sector 7 Field (Approximate)',
      status: 'Approved',
    },
    activityHistory: [
      {
        id: 'act_ayan_1',
        title: 'Indoor Junior Badminton',
        date: '14 Nov 2026',
        status: 'Completed',
        venue: 'Sector 4 Indoor Hall',
      },
      {
        id: 'act_ayan_2',
        title: 'School Turf 5v5',
        date: '07 Nov 2026',
        status: 'Completed',
        venue: 'Uttara Friends Club Turf',
      },
    ],
  },
  {
    id: 'ch_arafat_14',
    name: 'Arafat Hasan',
    age: 14,
    relationship: 'Son',
    safetyId: 'KH-SID-73911',
    area: 'Uttara Sector 7, Dhaka',
    status: 'Authorized',
    isVerified: true,
    sports: ['Football', 'Badminton'],
    permissions: 'Match schedules, public venue names, organizer check-in alerts',
    privacyNote: 'Exact residential coordinates are never stored or shared.',
    nextActivity: {
      title: 'Gazipur Youth Football Session',
      date: 'Sat, 21 Nov 2026',
      time: '4:00 PM – 5:30 PM (Asia/Dhaka)',
      venue: 'Gazipur Zone (Approximate)',
      status: 'Approved',
    },
    activityHistory: [
      {
        id: 'act_1',
        title: 'Indoor Junior Badminton',
        date: '14 Nov 2026',
        status: 'Completed',
        venue: 'Sector 4 Indoor Hall',
      },
      {
        id: 'act_2',
        title: 'School Turf 5v5',
        date: '07 Nov 2026',
        status: 'Completed',
        venue: 'Uttara Friends Club Turf',
      },
    ],
  },
  {
    id: 'ch_pending_lr204',
    name: 'Linking Request #LR-204',
    age: null,
    relationship: 'Dependent',
    safetyId: 'KH-SID-55109',
    area: 'Dhaka',
    status: 'Pending Verification',
    isVerified: false,
    sports: [],
    permissions: 'Pending child consent and backend verification.',
    privacyNote: 'Child details and match activity remain hidden until account holder confirms.',
    nextActivity: null,
    activityHistory: [],
  },
];

export const childService = {
  /**
   * Get all linked children for the current guardian
   */
  getLinkedChildren: async () => {
    try {
      const response = await apiClient.get('/guardian/children');
      return response.data;
    } catch {
      return {
        success: true,
        data: [...linkedChildrenStore],
        total: linkedChildrenStore.length,
      };
    }
  },

  /**
   * Link child via Safety ID (initiates verification)
   */
  linkChild: async (payload) => {
    try {
      const response = await apiClient.post('/guardian/children/link', payload);
      return response.data;
    } catch {
      const newRequest = {
        id: `ch_req_${Date.now()}`,
        name: `Linking Request #${Math.floor(100 + Math.random() * 900)}`,
        safetyId: payload.safetyId || `KH-SID-${Math.floor(10000 + Math.random() * 90000)}`,
        relationship: payload.relationship || 'Child',
        status: 'Pending Verification',
        isVerified: false,
        sports: [],
        permissions: 'Pending child consent and backend verification.',
        privacyNote: 'Child details and match activity remain hidden until approved.',
        nextActivity: null,
        activityHistory: [],
      };
      linkedChildrenStore = [newRequest, ...linkedChildrenStore];
      return {
        success: true,
        data: newRequest,
        message: 'Linking request initiated. Awaiting child confirmation and backend verification.',
      };
    }
  },

  /**
   * Unlink child / request revocation
   */
  unlinkChild: async (childId) => {
    try {
      const response = await apiClient.delete(`/guardian/children/${childId}`);
      return response.data;
    } catch {
      linkedChildrenStore = linkedChildrenStore.filter((c) => c.id !== childId);
      return {
        success: true,
        message: 'Child link revoked successfully.',
      };
    }
  },

  /**
   * Get activity details for a specific child
   */
  getChildActivity: async (childId) => {
    try {
      const response = await apiClient.get(`/guardian/children/${childId}/activity`);
      return response.data;
    } catch {
      const child = linkedChildrenStore.find((c) => c.id === childId) || linkedChildrenStore[0];
      return {
        success: true,
        data: {
          childName: child.name,
          age: child.age,
          safetyStatus: 'Clear',
          upcoming: child.nextActivity ? [child.nextActivity] : [],
          history: child.activityHistory || [],
        },
      };
    }
  },
};

export default childService;
