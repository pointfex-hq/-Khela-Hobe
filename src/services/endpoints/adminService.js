import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const adminService = {
  getAdminDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard');
    const dto = unwrapEnvelope(response) || {};
    return {
      success: true,
      data: {
        metrics: {
          totalUsers: dto.totalUsers ?? 0,
          activeUsers: dto.activeUsers ?? dto.totalUsers ?? 0,
          totalPlayers: dto.totalPlayers ?? 0,
          totalOrganizers: dto.totalOrganizers ?? 0,
          totalGuardians: dto.totalGuardians ?? 0,
          totalMatches: dto.totalMatches ?? dto.activeMatches ?? 0,
          activeMatches: dto.activeMatches ?? 0,
          pendingReports: dto.pendingReports ?? 0,
          reportedMatches: dto.reportedMatches ?? dto.pendingReports ?? 0,
          weeklyGrowthRate: dto.weeklyGrowthRate ?? 0,
        },
        weeklyActivity: dto.weeklyActivity || [],
        roleDistribution: dto.roleDistribution || [],
        recentModerationActions: dto.recentModerationActions || [],
      },
    };
  },

  approveOrganizer: async (userId, decision, note = '') => {
    const response = await apiClient.patch(`/admin/users/${userId}/approval`, {
      decision,
      note: note || undefined,
    });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message:
        decision === 'APPROVED'
          ? 'Organizer account approved and verified!'
          : 'Organizer application rejected.',
    };
  },

  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    const data = unwrapEnvelope(response) || {};
    return {
      success: true,
      data: Array.isArray(data.content) ? data.content : [],
      total: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 1,
      availableActions: data.availableActions || [],
    };
  },
};

export default adminService;
