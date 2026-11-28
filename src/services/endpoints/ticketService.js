import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

export const ticketService = {
  getAvailableTickets: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/tickets`);
    return { success: true, data: unwrapEnvelope(response) };
  },

  bookTicket: async (eventId, payload) => {
    const response = await apiClient.post(`/events/${eventId}/tickets/book`, payload);
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Pass reservation confirmed!',
    };
  },

  getMyTickets: async (params = {}) => {
    const response = await apiClient.get('/tickets/my', { params });
    const raw = unwrapEnvelope(response);
    const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    return {
      success: true,
      data: items,
      total: raw?.totalElements ?? items.length,
      page: raw?.page ?? 0,
      totalPages: raw?.totalPages ?? 1,
    };
  },

  getTicketDetails: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return { success: true, data: unwrapEnvelope(response) };
  },

  verifyTicket: async (ticketCode, tournamentId = undefined, autoCheckIn = true) => {
    const response = await apiClient.post('/tickets/verify', {
      code: ticketCode,
      autoCheckIn,
      ...(tournamentId ? { tournamentId } : {}),
    });
    const res = unwrapEnvelope(response) || {};
    return {
      success: true,
      status: res.status || 'INVALID',
      message: res.message || '',
      data: res.data || null,
    };
  },

  checkInTicket: async (ticketId) => {
    const response = await apiClient.post(`/tickets/${ticketId}/check-in`);
    const data = unwrapEnvelope(response);
    return {
      success: true,
      data,
      message: `Check-in confirmed for ${data?.attendeeName || 'attendee'}!`,
    };
  },

  cancelTicket: async (ticketId, reason = 'Cancelled by attendee') => {
    const response = await apiClient.post(`/tickets/${ticketId}/cancel`, { reason });
    return {
      success: true,
      data: unwrapEnvelope(response),
      message: 'Reservation cancelled successfully.',
    };
  },

  getEventTicketsRegistry: async (eventId, withSummary = false) => {
    const response = await apiClient.get(`/events/${eventId}/tickets/registry`, {
      params: withSummary ? { withSummary: 1 } : undefined,
    });
    const data = unwrapEnvelope(response);
    if (withSummary && data && !Array.isArray(data)) {
      return {
        success: true,
        data: Array.isArray(data.tickets) ? data.tickets : [],
        summary: data.summary || null,
      };
    }
    return {
      success: true,
      data: Array.isArray(data) ? data : [],
      summary: null,
    };
  },

  getEventCoupons: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/coupons`);
    const list = unwrapEnvelope(response);
    return { success: true, data: Array.isArray(list) ? list : [] };
  },

  createCoupon: async (eventId, payload) => {
    const response = await apiClient.post(`/events/${eventId}/coupons`, payload);
    return { success: true, data: unwrapEnvelope(response) };
  },

  toggleCoupon: async (eventId, couponId, active) => {
    const response = await apiClient.patch(`/events/${eventId}/coupons/${couponId}`, { active });
    return { success: true, data: unwrapEnvelope(response) };
  },

  deleteCoupon: async (eventId, couponId) => {
    await apiClient.delete(`/events/${eventId}/coupons/${couponId}`);
    return { success: true };
  },

  validateCoupon: async (eventId, payload) => {
    const response = await apiClient.post(`/events/${eventId}/coupons/validate`, payload);
    return { success: true, data: unwrapEnvelope(response) };
  },
};

export default ticketService;
