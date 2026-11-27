import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services/endpoints/eventService';
import { toastService } from '../components/feedback/toastService';

export const useEvents = (initialFilters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.getEvents(filters);
      setEvents(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
      toastService.error('Unable to load tournaments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    events,
    loading,
    error,
    filters,
    updateFilters,
    refresh: fetchEvents,
  };
};

export default useEvents;
