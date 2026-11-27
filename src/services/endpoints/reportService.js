import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeReport } from '../../utils/dtoMappers';

export const reportService = {
  createReport: async (payload) => {
    const response = await apiClient.post('/reports', payload);
    return { success: true, data: normalizeReport(unwrapEnvelope(response)) };
  },

  getMyReports: async (params = {}) => {
    const response = await apiClient.get('/reports/mine', { params });
    const pageData = unwrapEnvelope(response);
    const list = Array.isArray(pageData?.content) ? pageData.content.map(normalizeReport) : [];
    return { success: true, data: list, total: pageData?.totalElements ?? list.length };
  },

  getReportById: async (id) => {
    const response = await apiClient.get(`/reports/${id}`);
    return { success: true, data: normalizeReport(unwrapEnvelope(response)) };
  },

  getReports: async (filters = {}) => {
    const params = {
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    };
    if (filters.status && filters.status !== 'All Statuses') {
      params.status =
        filters.status.toUpperCase() === 'REJECTED'
          ? 'DISMISSED'
          : filters.status.toUpperCase();
    }

    const response = await apiClient.get('/admin/reports', { params });
    const pageData = unwrapEnvelope(response);
    let results = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeReport)
      : Array.isArray(pageData)
        ? pageData.map(normalizeReport)
        : [];

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.id?.toLowerCase().includes(q) ||
          r.matchTitle?.toLowerCase().includes(q) ||
          r.reporterName?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: results,
      total: pageData?.totalElements ?? results.length,
      pendingCount: results.filter((r) => r.status === 'Pending').length,
    };
  },

  reviewReport: async (id, payload) => {
    const status =
      payload.status ||
      (payload.action === 'reject' || payload.action === 'dismiss' ? 'DISMISSED' : 'RESOLVED');
    const resolutionNote = payload.resolutionNote ?? payload.note ?? '';

    const response = await apiClient.post(`/admin/reports/${id}/resolve`, {
      status,
      resolutionNote,
    });
    const updated = normalizeReport(unwrapEnvelope(response));
    return {
      success: true,
      data: updated,
      message: `Report #${id} marked as ${updated.status}.`,
    };
  },
};

export default reportService;
