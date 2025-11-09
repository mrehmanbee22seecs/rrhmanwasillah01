/**
 * Notification Types and Interfaces
 * Defines notification structure, types, and preferences
 */

export type NotificationType = 
  | 'project_update'
  | 'application_status'
  | 'message'
  | 'reminder'
  | 'achievement'
  | 'system'
  | 'event_reminder'
  | 'project_application'
  | 'welcome';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  readAt?: any; // Firestore timestamp
  createdAt: any; // Firestore timestamp
  data?: {
    // Additional data for notification actions
    link?: string;
    projectId?: string;
    eventId?: string;
    applicationId?: string;
    messageId?: string;
    [key: string]: any;
  };
  actionUrl?: string; // URL to navigate when notification is clicked
  icon?: string; // Icon name or URL
  imageUrl?: string; // Optional image for notification
}

export interface NotificationPreferences {
  userId: string;
  // In-app notifications
  inApp: {
    enabled: boolean;
    types: {
      [key in NotificationType]: boolean;
    };
  };
  // Email notifications
  email: {
    enabled: boolean;
    types: {
      [key in NotificationType]: boolean;
    };
    weeklyDigest: boolean;
  };
  // Push notifications
  push: {
    enabled: boolean;
    types: {
      [key in NotificationType]: boolean;
    };
  };
  // Quiet hours (no notifications during this time)
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone?: string;
  };
  updatedAt: any; // Firestore timestamp
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    [key in NotificationType]: number;
  };
}

export interface PushNotificationSubscription {
  userId: string;
  token: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  createdAt: any;
  updatedAt: any;
}

