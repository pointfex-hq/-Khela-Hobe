import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/endpoints/adminService';
import { userService } from '../services/endpoints/userService';
import { sportsService } from '../services/endpoints/sportsService';
import { moderationService } from '../services/endpoints/moderationService';
import { reportService } from '../services/endpoints/reportService';
import { toastService } from '../components/feedback/toastService';

export const useAdmin = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAdminDashboard();
      if (res.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
      toastService.error('Unable to fetch admin metrics');
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
    userService,
    sportsService,
    moderationService,
    reportService,
  };
};

export default useAdmin;
