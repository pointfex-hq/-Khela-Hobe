import { useState, useEffect, useCallback } from 'react';
import { guardianService } from '../services/endpoints/guardianService';
import { childService } from '../services/endpoints/childService';
import { safetyService } from '../services/endpoints/safetyService';
import { toastService } from '../components/feedback/toastService';

export const useGuardian = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await guardianService.getGuardianDashboard();
      if (res.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load guardian oversight');
      toastService.error('Unable to fetch guardian dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: fetchDashboard,
    childService,
    safetyService,
  };
};

export default useGuardian;
