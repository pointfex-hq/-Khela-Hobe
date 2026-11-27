import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeUser, normalizeMatch } from '../../utils/dtoMappers';
import { notificationService } from './notificationService';

export const userService = {
  getUsers: async (filters = {}) => {
    const params = {
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    };
    if (filters.search?.trim() || filters.q?.trim()) {
      params.q = (filters.search || filters.q).trim();
    }
    if (filters.approvalStatus && filters.approvalStatus !== 'ALL') {
      params.approvalStatus = filters.approvalStatus;
    }

    const response = await apiClient.get('/admin/users', { params });
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeUser)
      : Array.isArray(pageData)
        ? pageData.map(normalizeUser)
        : [];

    let filtered = list;
    if (filters.role && filters.role !== 'All Roles') {
      filtered = filtered.filter((u) =>
        u.roles?.some((r) => r.toLowerCase() === filters.role.toLowerCase())
      );
    }
    if (filters.status && filters.status !== 'All Statuses') {
      filtered = filtered.filter((u) => u.status?.toLowerCase() === filters.status.toLowerCase());
    }

    return {
      success: true,
      data: filtered,
      total: pageData?.totalElements ?? filtered.length,
      pendingOrganizerCount: pageData?.pendingOrganizerCount ?? 0,
      page: pageData?.page ?? 0,
      totalPages: pageData?.totalPages ?? 1,
    };
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return { success: true, data: normalizeUser(unwrapEnvelope(response)) };
  },

  getUserMatches: async (userId, params = {}) => {
    const response = await apiClient.get(`/users/${userId}/matches`, { params });
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeMatch)
      : Array.isArray(pageData)
        ? pageData.map(normalizeMatch)
        : [];
    return {
      success: true,
      data: list,
      total: pageData?.totalElements ?? list.length,
    };
  },

  updateUserStatus: async (id, payload = {}) => {
    const active =
      typeof payload.active === 'boolean'
        ? payload.active
        : payload.action === 'reactivate' || payload.status === 'Active';

    await apiClient.patch(`/admin/users/${id}/status`, { active });
    return {
      success: true,
      message: `User status updated to ${active ? 'Active' : 'Suspended'}.`,
    };
  },

  deleteUser: async (id) => {
    await apiClient.delete(`/admin/users/${id}`);
    return {
      success: true,
      message: 'User account and associated data permanently deleted.',
    };
  },

  getNotifications: async (category = 'all') => notificationService.getNotifications(category),

  updateProfile: async (profileData) => {
    const response = await apiClient.patch('/users/me', profileData);
    return { success: true, data: normalizeUser(unwrapEnvelope(response)) };
  },
};

export default userService;
