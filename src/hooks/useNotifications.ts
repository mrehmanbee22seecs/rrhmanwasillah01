/**
 * useNotifications Hook
 * React hook for managing notifications with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserNotifications,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  requestPushNotificationPermission,
  savePushNotificationToken,
  setupPushNotificationHandler,
} from '../services/notificationService';
import { Notification, NotificationPreferences, NotificationStats, NotificationType } from '../types/notifications';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotif: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  enablePushNotifications: () => Promise<boolean>;
}

export function useNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}): UseNotificationsReturn {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [notifs, notificationStats, prefs] = await Promise.all([
        getUserNotifications(currentUser.uid, options),
        getNotificationStats(currentUser.uid),
        getUserNotificationPreferences(currentUser.uid),
      ]);
      setNotifications(notifs);
      setStats(notificationStats);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, options?.limit, options?.unreadOnly, options?.type]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (notifs) => {
        setNotifications(notifs);
        // Update stats
        getNotificationStats(currentUser.uid).then(setStats).catch(console.error);
      },
      options
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, options?.limit, options?.unreadOnly, options?.type]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Set up push notification handler
  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    let unsubscribe: (() => void) | null = null;
    
    setupPushNotificationHandler((payload) => {
      console.log('Push notification received:', payload);
      // Refresh notifications when push notification is received
      loadNotifications();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid, loadNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!currentUser?.uid) return;

      try {
        await markNotificationAsRead(notificationId, currentUser.uid);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          )
        );
        // Update stats
        const newStats = await getNotificationStats(currentUser.uid);
        setStats(newStats);
      } catch (err) {
        console.error('Error marking notification as read:', err);
        setError(err instanceof Error ? err : new Error('Failed to mark as read'));
      }
    },
    [currentUser?.uid]
  );

  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      await markAllNotificationsAsRead(currentUser.uid);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
      );
      // Update stats
      const newStats = await getNotificationStats(currentUser.uid);
      setStats(newStats);
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark all as read'));
    }
  }, [currentUser?.uid]);

  const deleteNotif = useCallback(
    async (notificationId: string) => {
      if (!currentUser?.uid) return;

      try {
        await deleteNotification(notificationId, currentUser.uid);
        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Update stats
        const newStats = await getNotificationStats(currentUser.uid);
        setStats(newStats);
      } catch (err) {
        console.error('Error deleting notification:', err);
        setError(err instanceof Error ? err : new Error('Failed to delete notification'));
      }
    },
    [currentUser?.uid]
  );

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!currentUser?.uid) return;

      try {
        await updateNotificationPreferences(currentUser.uid, prefs);
        const updatedPrefs = await getUserNotificationPreferences(currentUser.uid);
        setPreferences(updatedPrefs);
      } catch (err) {
        console.error('Error updating preferences:', err);
        setError(err instanceof Error ? err : new Error('Failed to update preferences'));
      }
    },
    [currentUser?.uid]
  );

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!currentUser?.uid) return false;

    try {
      const token = await requestPushNotificationPermission();
      if (token) {
        await savePushNotificationToken(currentUser.uid, token);
        await updateNotificationPreferences(currentUser.uid, {
          push: {
            enabled: true,
            types: preferences?.push?.types || {},
          },
        });
        const updatedPrefs = await getUserNotificationPreferences(currentUser.uid);
        setPreferences(updatedPrefs);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error enabling push notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to enable push notifications'));
      return false;
    }
  }, [currentUser?.uid, preferences]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    stats,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    refreshNotifications,
    updatePreferences,
    enablePushNotifications,
  };
}

