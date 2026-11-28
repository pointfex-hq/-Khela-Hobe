import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeApplication } from '../../utils/dtoMappers';

export const applicationService = {
  getMyApplications: async (status = 'all', params = {}) => {
    const response = await apiClient.get('/applications/my', {
      params: {
        ...(status && status !== 'all' ? { status: status.toUpperCase() } : {}),
        ...params,
      },
    });
    const raw = unwrapEnvelope(response);
    const list = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    const normalized = list.map(normalizeApplication);
    return {
      success: true,
      data: normalized,
      total: raw?.totalElements ?? normalized.length,
      page: raw?.page ?? 0,
      totalPages: raw?.totalPages ?? 1,
    };
  },

  submitApplication: async (matchId, payload = {}) => {
    const message = (payload.message ?? payload.playerNote ?? '').slice(0, 1000);
    const response = await apiClient.post(`/matches/${matchId}/apply`, { message });
    const app = normalizeApplication(unwrapEnvelope(response));
    return {
      success: true,
      data: app,
      message: 'Application submitted successfully. Awaiting organizer approval.',
    };
  },

  withdrawApplication: async (applicationId) => {
    await apiClient.delete(`/applications/${applicationId}`);
    return { success: true, message: 'Application withdrawn successfully.' };
  },

  getOrganizerApplications: async (matchId, params = {}) => {
    const endpoint = matchId ? `/matches/${matchId}/applications` : '/applications/organizer';
    const response = await apiClient.get(endpoint, { params });
    const raw = unwrapEnvelope(response);
    const list = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    const normalized = list.map(normalizeApplication);
    return {
      success: true,
      data: normalized,
      total: raw?.totalElements ?? normalized.length,
      page: raw?.page ?? 0,
      totalPages: raw?.totalPages ?? 1,
      pendingCount: normalized.filter((a) => a.status === 'pending').length,
    };
  },

  reviewApplication: async (matchId, applicationId, status, reviewNote = '') => {
    const response = await apiClient.post(
      `/matches/${matchId}/applications/${applicationId}/review`,
      { status, reviewNote: reviewNote ? reviewNote.slice(0, 1000) : undefined }
    );
    return {
      success: true,
      data: normalizeApplication(unwrapEnvelope(response)),
      message:
        status === 'APPROVED'
          ? 'Applicant accepted and slot reserved successfully.'
          : 'Application rejected.',
    };
  },

  approveApplication: async (applicationId, matchId) =>
    applicationService.reviewApplication(matchId, applicationId, 'APPROVED'),

  rejectApplication: async (applicationId, reason = '', matchId) =>
    applicationService.reviewApplication(matchId, applicationId, 'REJECTED', reason),
};

export default applicationService;
