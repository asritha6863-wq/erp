import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=20');
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (ids = []) => {
    try {
      await api.put('/notifications/read', { ids });
      setNotifications((prev) =>
        prev.map((n) => (!ids.length || ids.includes(n._id)) ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => {
        if (!ids.length) return 0;
        const marked = notifications.filter((n) => ids.includes(n._id) && !n.isRead).length;
        return Math.max(0, prev - marked);
      });
    } catch { /* silent */ }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    await markAsRead([]);
    setUnreadCount(0);
  }, [markAsRead]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const notif = notifications.find((n) => n._id === id);
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch { /* silent */ }
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllRead,
      deleteNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
