import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/endpoints/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(isAuthenticated);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isAuth) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications('all'),
        notificationService.getUnreadCount().catch(() => null),
      ]);
      const items = listRes?.data || [];
      setNotifications(items);
      if (typeof countRes?.unreadCount === 'number') {
        setUnreadCount(countRes.unreadCount);
      } else {
        setUnreadCount(items.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    }
  }, [isAuth]);

  useEffect(() => {
    if (isLoading) return;
    fetchNotifications();
  }, [isLoading, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read', err);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
