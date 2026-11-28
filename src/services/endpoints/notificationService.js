import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeNotification } from '../../utils/dtoMappers';

export const notificationService = {
  getNotifications: async (category = 'all', params = {}) => {
    const response = await apiClient.get('/notifications', {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    });
    const pageData = unwrapEnvelope(response);
    const allItems = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeNotification)
      : Array.isArray(pageData)
        ? pageData.map(normalizeNotification)
        : [];

    let results = allItems;
    if (category === 'unread') {
      results = allItems.filter((n) => !n.read);
    } else if (category && category !== 'all') {
      results = allItems.filter((n) => n.category === category);
    }

    return {
      success: true,
      data: results,
      total: pageData?.totalElements ?? results.length,
      page: pageData?.page ?? 0,
      totalPages: pageData?.totalPages ?? 1,
      unreadCount: allItems.filter((n) => !n.read).length,
    };
  },

  markAsRead: async (id) => {
    await apiClient.post(`/notifications/${id}/read`);
    return { success: true };
  },

  markAllAsRead: async () => {
    await apiClient.post('/notifications/read-all');
    return { success: true, unreadCount: 0 };
  },

  deleteNotification: async (id) => {
    await apiClient.delete(`/notifications/${id}`);
    return { success: true };
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    const data = unwrapEnvelope(response);
    const unreadCount = data?.unreadCount ?? data?.count ?? 0;
    return { unreadCount, count: unreadCount };
  },

  getPreferences: async () => {
    const response = await apiClient.get('/users/me/notification-preferences');
    return {
      success: true,
      data: unwrapEnvelope(response) || {},
    };
  },

  updatePreferences: async (prefs) => {
    const response = await apiClient.put('/users/me/notification-preferences', prefs);
    return {
      success: true,
      data: unwrapEnvelope(response) || {},
      message: 'Notification preferences saved!',
    };
  },
};

export default notificationService;
