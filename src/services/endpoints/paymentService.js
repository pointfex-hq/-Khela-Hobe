import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

/**
 * SSLCommerz Payment Gateway Service
 */
export const paymentService = {
  initiateSslcommerzPayment: async (payload) => {
    const response = await apiClient.post('/payments/sslcommerz/init', payload);
    const data = unwrapEnvelope(response);
    return {
      success: true,
      data,
    };
  },

  getPaymentStatus: async (tranId) => {
    const response = await apiClient.get(`/payments/${encodeURIComponent(tranId)}`);
    return {
      success: true,
      data: unwrapEnvelope(response),
    };
  },

  getMyPayments: async () => {
    const response = await apiClient.get('/payments/my');
    const list = unwrapEnvelope(response);
    return {
      success: true,
      data: Array.isArray(list) ? list : [],
    };
  },
};

export default paymentService;
