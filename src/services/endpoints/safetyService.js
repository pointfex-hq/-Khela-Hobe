import apiClient from '../api/apiClient';
import { unwrapEnvelope, normalizeSafetyAlert } from '../../utils/dtoMappers';

export const safetyService = {
  getChildSafetySettings: async (childId) => {
    const response = await apiClient.get(`/guardian/children/${childId}/settings`);
    const dto = unwrapEnvelope(response);
    return {
      success: true,
      data: {
        ...dto,
        matchJoinAlerts: dto?.allowMatchParticipation ?? true,
        venueCheckInAlerts: dto?.requireGuardianApproval ?? true,
        eveningCurfewAlerts: true,
        publicVenueVisibility: dto?.allowLocationSharing ?? false,
        hidePrivateChatAndCoordinates: !(dto?.allowLocationSharing ?? false),
      },
    };
  },

  updateChildSafetySettings: async (childId, payload) => {
    const dto = {
      allowMatchParticipation: payload.allowMatchParticipation ?? payload.matchJoinAlerts ?? true,
      requireGuardianApproval: payload.requireGuardianApproval ?? payload.venueCheckInAlerts ?? true,
      allowLocationSharing: payload.allowLocationSharing ?? payload.publicVenueVisibility ?? false,
    };

    const response = await apiClient.put(`/guardian/children/${childId}/settings`, dto);
    const updated = unwrapEnvelope(response);
    return {
      success: true,
      data: {
        ...updated,
        matchJoinAlerts: updated?.allowMatchParticipation ?? dto.allowMatchParticipation,
        venueCheckInAlerts: updated?.requireGuardianApproval ?? dto.requireGuardianApproval,
        eveningCurfewAlerts: payload.eveningCurfewAlerts ?? true,
        publicVenueVisibility: updated?.allowLocationSharing ?? dto.allowLocationSharing,
        hidePrivateChatAndCoordinates: true,
      },
      message: 'Safety preferences saved successfully.',
    };
  },

  getSafetyAlerts: async (category = 'all', params = {}) => {
    const response = await apiClient.get('/guardian/alerts', {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    });
    const pageData = unwrapEnvelope(response);
    const allAlerts = Array.isArray(pageData?.content)
      ? pageData.content.map(normalizeSafetyAlert)
      : Array.isArray(pageData)
        ? pageData.map(normalizeSafetyAlert)
        : [];

    const results =
      category && category !== 'all'
        ? allAlerts.filter((a) => a.category === category)
        : allAlerts;

    return {
      success: true,
      data: results,
      unreadCount: allAlerts.filter((a) => a.unread).length,
    };
  },

  markAlertAsRead: async (alertId) => {
    await apiClient.post(`/guardian/alerts/${alertId}/read`);
    return { success: true, message: 'Alert marked as read.' };
  },

  markAllAlertsAsRead: async () => {
    const res = await safetyService.getSafetyAlerts('all');
    const unread = (res.data || []).filter((a) => a.unread);
    await Promise.all(unread.map((a) => safetyService.markAlertAsRead(a.id)));
    return { success: true, message: 'All safety alerts marked as read.' };
  },
};

export default safetyService;
