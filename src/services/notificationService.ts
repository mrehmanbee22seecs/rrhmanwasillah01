/**
 * Notification Service
 * Handles all notification operations: create, read, update, delete, and real-time subscriptions
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationPreferences, NotificationStats, NotificationType } from '../types/notifications';
import { sendNotificationEmail } from '../utils/notificationTemplates';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, initializeMessaging } from '../config/firebase';

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'>
): Promise<string> {
  try {
    const notificationRef = doc(collection(db, 'notifications'));
    const notificationData: Notification = {
      ...notification,
      id: notificationRef.id,
      userId,
      read: false,
      createdAt: serverTimestamp(),
    };

    await setDoc(notificationRef, notificationData);

    // Check user preferences and send email/push if enabled
    const preferences = await getUserNotificationPreferences(userId);
    
    if (preferences?.email?.enabled && preferences.email.types[notification.type]) {
      try {
        await sendNotificationEmail(notificationData, userId);
      } catch (error) {
        console.error('Failed to send notification email:', error);
      }
    }

    if (preferences?.push?.enabled && preferences.push.types[notification.type]) {
      try {
        const messagingInstance = messaging || await initializeMessaging();
        if (messagingInstance) {
          await sendPushNotification(userId, notificationData);
        }
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }

    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const prefsRef = doc(db, 'notification_preferences', userId);
    const prefsSnap = await getDoc(prefsRef);
    
    if (prefsSnap.exists()) {
      return prefsSnap.data() as NotificationPreferences;
    }
    
    // Return default preferences if none exist
    return getDefaultPreferences(userId);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return getDefaultPreferences(userId);
  }
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences(userId: string): NotificationPreferences {
  const defaultTypes = {
    project_update: true,
    application_status: true,
    message: true,
    reminder: true,
    achievement: true,
    system: true,
    event_reminder: true,
    project_application: true,
    welcome: true,
  };

  return {
    userId,
    inApp: {
      enabled: true,
      types: { ...defaultTypes },
    },
    email: {
      enabled: true,
      types: { ...defaultTypes },
      weeklyDigest: false,
    },
    push: {
      enabled: false, // Default to false, user must enable
      types: { ...defaultTypes },
    },
    updatedAt: serverTimestamp(),
  };
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const prefsRef = doc(db, 'notification_preferences', userId);
    const currentPrefs = await getUserNotificationPreferences(userId);
    
    const updatedPrefs: NotificationPreferences = {
      ...(currentPrefs || getDefaultPreferences(userId)),
      ...preferences,
      userId,
      updatedAt: serverTimestamp(),
    };

    await setDoc(prefsRef, updatedPrefs, { merge: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }
): Promise<Notification[]> {
  try {
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (options?.unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  }
): () => void {
  try {
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (options?.unreadOnly) {
      q = query(q, where('read', '==', false));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit || 50));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        callback(notifications);
      },
      (error) => {
        console.error('Error subscribing to notifications:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notification subscription:', error);
    return () => {};
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);
    
    if (!notificationSnap.exists()) {
      throw new Error('Notification not found');
    }

    const notification = notificationSnap.data() as Notification;
    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);
    
    if (!notificationSnap.exists()) {
      throw new Error('Notification not found');
    }

    const notification = notificationSnap.data() as Notification;
    if (notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string): Promise<NotificationStats> {
  try {
    const notifications = await getUserNotifications(userId);
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      byType: {
        project_update: 0,
        application_status: 0,
        message: 0,
        reminder: 0,
        achievement: 0,
        system: 0,
        event_reminder: 0,
        project_application: 0,
        welcome: 0,
      },
    };

    notifications.forEach((notification) => {
      if (stats.byType[notification.type] !== undefined) {
        stats.byType[notification.type]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
}

/**
 * Request push notification permission and get token
 */
export async function requestPushNotificationPermission(): Promise<string | null> {
  try {
    // Initialize messaging if not already initialized
    const messagingInstance = messaging || await initializeMessaging();
    if (!messagingInstance) {
      console.warn('Firebase Cloud Messaging not available');
      return null;
    }

    // Check if Notification API is available
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return null;
    }

    // Use browser Notification API
    const permission = await window.Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VAPID key not configured. Set VITE_FIREBASE_VAPID_KEY in .env');
        return null;
      }
      const token = await getToken(messagingInstance, {
        vapidKey,
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error requesting push notification permission:', error);
    return null;
  }
}

/**
 * Save push notification subscription token
 */
export async function savePushNotificationToken(
  userId: string,
  token: string
): Promise<void> {
  try {
    const tokenRef = doc(db, 'push_notification_tokens', `${userId}_${token.substring(0, 20)}`);
    await setDoc(tokenRef, {
      userId,
      token,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving push notification token:', error);
    throw error;
  }
}

/**
 * Send push notification (via Cloud Functions or directly)
 */
async function sendPushNotification(
  userId: string,
  notification: Notification
): Promise<void> {
  // This would typically be handled by a Cloud Function
  // For now, we'll just log it
  console.log('Would send push notification to user:', userId, notification);
  
  // In production, you would call a Cloud Function that uses the FCM Admin SDK
  // to send the notification to all tokens associated with the user
}

/**
 * Set up push notification message handler
 */
export async function setupPushNotificationHandler(
  callback: (payload: any) => void
): Promise<() => void> {
  try {
    const messagingInstance = messaging || await initializeMessaging();
    if (!messagingInstance) {
      return () => {};
    }

    const unsubscribe = onMessage(messagingInstance, (payload) => {
      callback(payload);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up push notification handler:', error);
    return () => {};
  }
}

/**
 * Delete old notifications (cleanup function)
 */
export async function deleteOldNotifications(
  userId: string,
  daysOld: number = 30
): Promise<void> {
  try {
    const cutoffDate = Timestamp.fromDate(
      new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    );

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('createdAt', '<', cutoffDate),
      where('read', '==', true)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
}

