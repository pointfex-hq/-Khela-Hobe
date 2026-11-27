import apiClient from '../api/apiClient';
import { MOCK_NOTIFICATIONS } from '../../mocks/mockData';

let notificationsList = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  /**
   * Get notifications by category (all, unread, matches, applications, safety, system)
   */
  getNotifications: async (category = 'all') => {
    try {
      const response = await apiClient.get('/notifications', { params: { category } });
      return response.data;
    } catch {
      let results = [...notificationsList];
      if (category === 'unread') {
        results = results.filter((n) => !n.read);
      } else if (category && category !== 'all') {
        results = results.filter((n) => n.category === category);
      }
      return {
        data: results,
        total: results.length,
        unreadCount: notificationsList.filter((n) => !n.read).length,
      };
    }
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id) => {
    try {
      const response = await apiClient.patch(`/notifications/${id}/read`);
      return response.data;
    } catch {
      notificationsList = notificationsList.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        success: true,
        unreadCount: notificationsList.filter((n) => !n.read).length,
      };
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.post('/notifications/read-all');
      return response.data;
    } catch {
      notificationsList = notificationsList.map((n) => ({ ...n, read: true }));
      return {
        success: true,
        unreadCount: 0,
      };
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/notifications/${id}`);
      return response.data;
    } catch {
      notificationsList = notificationsList.filter((n) => n.id !== id);
      return {
        success: true,
        unreadCount: notificationsList.filter((n) => !n.read).length,
      };
    }
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data;
    } catch {
      return {
        count: notificationsList.filter((n) => !n.read).length,
      };
    }
  },
};

export default notificationService;
