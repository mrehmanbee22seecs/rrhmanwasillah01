/**
 * Notification Helpers
 * Helper functions to create notifications from various parts of the app
 */

import { createNotification } from '../services/notificationService';
import {
  createProjectUpdateNotification,
  createApplicationStatusNotification,
  createMessageNotification,
  createReminderNotification,
  createAchievementNotification,
  createEventReminderNotification,
  createProjectApplicationNotification,
  createWelcomeNotification,
} from './notificationTemplates';

/**
 * Send welcome notification to new user
 */
export async function sendWelcomeNotification(userId: string, userName: string, role?: string) {
  try {
    const notification = createWelcomeNotification({ userId, userName, role });
    await createNotification(userId, notification);
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
}

/**
 * Send project update notification
 */
export async function sendProjectUpdateNotification(data: {
  projectId: string;
  projectName: string;
  updateType: 'approved' | 'rejected' | 'updated' | 'new_application';
  userId: string;
  link?: string;
}) {
  try {
    const notification = createProjectUpdateNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending project update notification:', error);
  }
}

/**
 * Send application status notification
 */
export async function sendApplicationStatusNotification(data: {
  applicationId: string;
  projectName?: string;
  eventName?: string;
  status: 'approved' | 'rejected' | 'pending';
  userId: string;
  link?: string;
}) {
  try {
    const notification = createApplicationStatusNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending application status notification:', error);
  }
}

/**
 * Send message notification
 */
export async function sendMessageNotification(data: {
  messageId: string;
  senderName: string;
  message: string;
  userId: string;
  link?: string;
}) {
  try {
    const notification = createMessageNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending message notification:', error);
  }
}

/**
 * Send reminder notification
 */
export async function sendReminderNotification(data: {
  reminderId: string;
  title: string;
  message: string;
  userId: string;
  link?: string;
}) {
  try {
    const notification = createReminderNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending reminder notification:', error);
  }
}

/**
 * Send achievement notification
 */
export async function sendAchievementNotification(data: {
  achievementId: string;
  achievementName: string;
  description: string;
  userId: string;
  link?: string;
}) {
  try {
    const notification = createAchievementNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

/**
 * Send event reminder notification
 */
export async function sendEventReminderNotification(data: {
  eventId: string;
  eventName: string;
  eventDate: string;
  userId: string;
  link?: string;
}) {
  try {
    const notification = createEventReminderNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending event reminder notification:', error);
  }
}

/**
 * Send project application notification (to project owner)
 */
export async function sendProjectApplicationNotification(data: {
  applicationId: string;
  projectName: string;
  applicantName: string;
  userId: string; // Project owner's userId
  link?: string;
}) {
  try {
    const notification = createProjectApplicationNotification(data);
    await createNotification(data.userId, notification);
  } catch (error) {
    console.error('Error sending project application notification:', error);
  }
}

