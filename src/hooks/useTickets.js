import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../services/endpoints/ticketService';
import { toastService } from '../components/feedback/toastService';

export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketService.getMyTickets();
      setTickets(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
      toastService.error('Unable to load passes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  const bookTicket = async (eventId, payload) => {
    try {
      const response = await ticketService.bookTicket(eventId, payload);
      toastService.success(response.message || 'Pass reserved successfully!');
      fetchMyTickets();
      return { success: true, data: response.data };
    } catch (err) {
      toastService.error(err.message || 'Failed to book pass');
      return { success: false, error: err };
    }
  };

  const cancelTicket = async (ticketId, reason) => {
    try {
      const response = await ticketService.cancelTicket(ticketId, reason);
      toastService.success(response.message || 'Pass cancelled');
      fetchMyTickets();
      return true;
    } catch (err) {
      toastService.error(err.message || 'Failed to cancel pass');
      return false;
    }
  };

  return {
    tickets,
    loading,
    error,
    refresh: fetchMyTickets,
    bookTicket,
    cancelTicket,
  };
};

export default useTickets;
