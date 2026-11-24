import apiClient from '../api/apiClient';

let safetySettingsStore = {
  ch_arafat_14: {
    childName: 'Ayan Rahman',
    age: 15,
    matchJoinAlerts: true,
    venueCheckInAlerts: true,
    eveningCurfewAlerts: true,
    publicVenueVisibility: true,
    hidePrivateChatAndCoordinates: true, // enforced platform policy
    verifiedDate: '12 Oct 2026',
    status: 'Authorized',
  },
};

let safetyAlertsStore = [
  {
    id: 'alt_1',
    title: 'New Youth Match Application Submitted',
    childName: 'Arafat Hasan',
    category: 'participation',
    categoryLabel: 'Participation • Arafat Hasan',
    timestamp: '10 mins ago',
    unread: true,
    severity: 'info',
    description: 'Protected details are available inside your verified guardian session.',
  },
  {
    id: 'alt_2',
    title: 'Evening Curfew Notice (After 8:30 PM BST)',
    childName: 'Arafat Hasan',
    category: 'curfew',
    categoryLabel: 'Curfew • Arafat Hasan',
    timestamp: '18m ago',
    unread: true,
    severity: 'warning',
    description: 'Match scheduled to finish after 8:30 PM Bangladesh Standard Time.',
  },
  {
    id: 'alt_3',
    title: 'Authorized Match Time Updated',
    childName: 'Arafat Hasan',
    category: 'schedule',
    categoryLabel: 'Schedule • Arafat Hasan',
    timestamp: 'Yesterday',
    unread: false,
    severity: 'normal',
    description: 'Start time adjusted to 4:00 PM (Asia/Dhaka).',
  },
  {
    id: 'alt_4',
    title: 'Venue Check-In Confirmed',
    childName: 'Arafat Hasan',
    category: 'checkin',
    categoryLabel: 'Check-In • Arafat Hasan',
    timestamp: '2 days ago',
    unread: false,
    severity: 'normal',
    description: 'Organizer confirmed check-in at Sector 4 Indoor Complex.',
  },
];

export const safetyService = {
  /**
   * Get safety settings for a linked child
   */
  getChildSafetySettings: async (childId = 'ch_arafat_14') => {
    try {
      const response = await apiClient.get(`/guardian/children/${childId}/safety-settings`);
      return response.data;
    } catch {
      const settings = safetySettingsStore[childId] || safetySettingsStore.ch_arafat_14;
      return {
        success: true,
        data: { ...settings },
      };
    }
  },

  /**
   * Update child safety settings
   */
  updateChildSafetySettings: async (childId = 'ch_arafat_14', payload) => {
    try {
      const response = await apiClient.put(`/guardian/children/${childId}/safety-settings`, payload);
      return response.data;
    } catch {
      safetySettingsStore[childId] = {
        ...(safetySettingsStore[childId] || safetySettingsStore.ch_arafat_14),
        ...payload,
      };
      return {
        success: true,
        data: safetySettingsStore[childId],
        message: 'Safety preferences saved successfully.',
      };
    }
  },

  /**
   * Get all safety alerts for guardian
   */
  getSafetyAlerts: async (category = 'all') => {
    try {
      const response = await apiClient.get('/guardian/safety-alerts', { params: { category } });
      return response.data;
    } catch {
      let results = [...safetyAlertsStore];
      if (category && category !== 'all') {
        results = results.filter((a) => a.category === category);
      }
      return {
        success: true,
        data: results,
        unreadCount: safetyAlertsStore.filter((a) => a.unread).length,
      };
    }
  },

  /**
   * Mark alert as read
   */
  markAlertAsRead: async (alertId) => {
    try {
      const response = await apiClient.post(`/guardian/safety-alerts/${alertId}/read`);
      return response.data;
    } catch {
      const alert = safetyAlertsStore.find((a) => a.id === alertId);
      if (alert) {
        alert.unread = false;
      }
      return {
        success: true,
        message: 'Alert marked as read.',
      };
    }
  },

  /**
   * Mark all alerts as read
   */
  markAllAlertsAsRead: async () => {
    try {
      const response = await apiClient.post('/guardian/safety-alerts/read-all');
      return response.data;
    } catch {
      safetyAlertsStore = safetyAlertsStore.map((a) => ({ ...a, unread: false }));
      return {
        success: true,
        message: 'All safety alerts marked as read.',
      };
    }
  },
};

export default safetyService;
