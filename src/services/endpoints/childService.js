import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeGuardianLink } from '../../utils/dtoMappers';
import { formatDateTimeDhaka } from '../../utils/formatters';

export const childService = {
  getLinkedChildren: async () => {
    const response = await apiClient.get('/guardian/children');
    const list = unwrapEnvelope(response);
    const normalized = Array.isArray(list) ? list.map(normalizeGuardianLink) : [];
    return {
      success: true,
      data: normalized,
      total: normalized.length,
    };
  },

  linkChild: async (payload) => {
    const dto = {
      childSafetyId: (payload.childSafetyId || payload.safetyId || '').trim(),
      relationship: payload.relationship || 'Son',
    };
    const response = await apiClient.post('/guardian/links', dto);
    const link = normalizeGuardianLink(unwrapEnvelope(response));
    return {
      success: true,
      data: link,
      message: 'Linking request initiated. Awaiting child confirmation and backend verification.',
    };
  },

  unlinkChild: async (childId) => {
    await apiClient.delete(`/guardian/children/${childId}`);
    return { success: true, message: 'Child link revoked successfully.' };
  },

  getChildActivity: async (childId) => {
    const response = await apiClient.get(`/guardian/children/${childId}/activity`);
    const pageData = unwrapEnvelope(response);
    const items = Array.isArray(pageData?.content)
      ? pageData.content
      : Array.isArray(pageData)
        ? pageData
        : [];

    const mapped = items.map((act) => ({
      id: act.id,
      title: act.description,
      venue: act.activityType || 'Authorized Match',
      status: 'Recorded',
      date: typeof act.timestamp === 'number' ? formatDateTimeDhaka(act.timestamp) : '',
      time: '',
    }));

    return {
      success: true,
      data: {
        safetyStatus: 'Clear',
        upcoming: [],
        history: mapped,
      },
    };
  },

  getIncomingRequests: async () => {
    const response = await apiClient.get('/guardian/requests/incoming');
    const list = unwrapEnvelope(response);
    return {
      success: true,
      data: Array.isArray(list) ? list : [],
    };
  },

  respondToRequest: async (requestId, action) => {
    const response = await apiClient.post(`/guardian/requests/${requestId}/respond`, {
      action,
    });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message:
        action === 'ACCEPT'
          ? 'Guardian link accepted!'
          : 'Guardian link request declined.',
    };
  },
};

export default childService;
