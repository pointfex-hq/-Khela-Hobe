import { useState, useEffect, useCallback } from 'react';
import { matchService } from '../services/endpoints/matchService';
import toast from 'react-hot-toast';

/**
 * Custom Hook encapsulating match discovery and reservation business logic
 */
export const useMatches = (initialFilters = {}) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await matchService.getMatches(filters);
      setMatches(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load matches');
      toast.error('Unable to fetch matches');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const joinMatch = async (matchId) => {
    try {
      const response = await matchService.joinMatch(matchId);
      toast.success(response.message || 'Slot reserved successfully');
      // Optimistic update
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, filledSlots: Math.min(m.totalSlots, m.filledSlots + 1) } : m
        )
      );
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to join match');
      return false;
    }
  };

  return {
    matches,
    loading,
    error,
    filters,
    updateFilters,
    refresh: fetchMatches,
    joinMatch,
  };
};
