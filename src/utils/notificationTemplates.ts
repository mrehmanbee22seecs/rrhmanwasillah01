/**
 * Notification Templates
 * Templates for creating notifications and sending emails
 */

import { Notification, NotificationType } from '../types/notifications';
import { sendWelcomeEmail, sendSubmissionConfirmation, sendApprovalEmail, sendReminderEmail } from '../services/mailerSendEmailService';

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    project_update: '📋',
    application_status: '📝',
    message: '💬',
    reminder: '⏰',
    achievement: '🏆',
    system: '🔔',
    event_reminder: '📅',
    project_application: '📨',
    welcome: '👋',
  };
  return icons[type] || '🔔';
}

/**
 * Create notification data for project updates
 */
export function createProjectUpdateNotification(data: {
  projectId: string;
  projectName: string;
  updateType: 'approved' | 'rejected' | 'updated' | 'new_application';
  userId: string;
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  const messages = {
    approved: `Your project "${data.projectName}" has been approved!`,
    rejected: `Your project "${data.projectName}" has been rejected.`,
    updated: `Your project "${data.projectName}" has been updated.`,
    new_application: `New application received for "${data.projectName}".`,
  };

  return {
    userId: data.userId,
    type: 'project_update',
    title: 'Project Update',
    message: messages[data.updateType],
    priority: data.updateType === 'approved' ? 'high' : 'medium',
    data: {
      projectId: data.projectId,
      link: data.link || `/projects/${data.projectId}`,
    },
    actionUrl: data.link || `/projects/${data.projectId}`,
    icon: getNotificationIcon('project_update'),
  };
}

/**
 * Create notification data for application status
 */
export function createApplicationStatusNotification(data: {
  applicationId: string;
  projectName?: string;
  eventName?: string;
  status: 'approved' | 'rejected' | 'pending';
  userId: string;
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  const itemName = data.projectName || data.eventName || 'Application';
  const messages = {
    approved: `Your application for "${itemName}" has been approved!`,
    rejected: `Your application for "${itemName}" has been rejected.`,
    pending: `Your application for "${itemName}" is under review.`,
  };

  return {
    userId: data.userId,
    type: 'application_status',
    title: 'Application Status Update',
    message: messages[data.status],
    priority: data.status === 'approved' ? 'high' : 'medium',
    data: {
      applicationId: data.applicationId,
      projectId: data.projectName ? data.applicationId : undefined,
      eventId: data.eventName ? data.applicationId : undefined,
      link: data.link || '/my-applications',
    },
    actionUrl: data.link || '/my-applications',
    icon: getNotificationIcon('application_status'),
  };
}

/**
 * Create notification data for messages
 */
export function createMessageNotification(data: {
  messageId: string;
  senderName: string;
  message: string;
  userId: string;
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  return {
    userId: data.userId,
    type: 'message',
    title: `New message from ${data.senderName}`,
    message: data.message.substring(0, 100) + (data.message.length > 100 ? '...' : ''),
    priority: 'medium',
    data: {
      messageId: data.messageId,
      link: data.link || '/dashboard',
    },
    actionUrl: data.link || '/dashboard',
    icon: getNotificationIcon('message'),
  };
}

/**
 * Create notification data for reminders
 */
export function createReminderNotification(data: {
  reminderId: string;
  title: string;
  message: string;
  userId: string;
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  return {
    userId: data.userId,
    type: 'reminder',
    title: data.title,
    message: data.message,
    priority: 'high',
    data: {
      reminderId: data.reminderId,
      link: data.link || '/reminders',
    },
    actionUrl: data.link || '/reminders',
    icon: getNotificationIcon('reminder'),
  };
}

/**
 * Create notification data for achievements
 */
export function createAchievementNotification(data: {
  achievementId: string;
  achievementName: string;
  description: string;
  userId: string;
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  return {
    userId: data.userId,
    type: 'achievement',
    title: `Achievement Unlocked: ${data.achievementName}`,
    message: data.description,
    priority: 'high',
    data: {
      achievementId: data.achievementId,
      link: data.link || '/dashboard',
    },
    actionUrl: data.link || '/dashboard',
    icon: getNotificationIcon('achievement'),
  };
}

/**
 * Create notification data for event reminders
 */
export function createEventReminderNotification(data: {
  eventId: string;
  eventName: string;
  eventDate: string;
  userId: string;
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  return {
    userId: data.userId,
    type: 'event_reminder',
    title: `Event Reminder: ${data.eventName}`,
    message: `Don't forget! ${data.eventName} is happening on ${data.eventDate}`,
    priority: 'high',
    data: {
      eventId: data.eventId,
      link: data.link || `/events/${data.eventId}`,
    },
    actionUrl: data.link || `/events/${data.eventId}`,
    icon: getNotificationIcon('event_reminder'),
  };
}

/**
 * Create notification data for project applications
 */
export function createProjectApplicationNotification(data: {
  applicationId: string;
  projectName: string;
  applicantName: string;
  userId: string; // Project owner's userId
  link?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  return {
    userId: data.userId,
    type: 'project_application',
    title: `New Application: ${data.projectName}`,
    message: `${data.applicantName} has applied to your project "${data.projectName}"`,
    priority: 'medium',
    data: {
      applicationId: data.applicationId,
      projectId: data.applicationId,
      link: data.link || '/my-applications',
    },
    actionUrl: data.link || '/my-applications',
    icon: getNotificationIcon('project_application'),
  };
}

/**
 * Create welcome notification
 */
export function createWelcomeNotification(data: {
  userId: string;
  userName: string;
  role?: string;
}): Omit<Notification, 'id' | 'createdAt' | 'read' | 'readAt'> {
  return {
    userId: data.userId,
    type: 'welcome',
    title: `Welcome to Wasillah, ${data.userName}!`,
    message: `Thank you for joining our community. Get started by exploring projects and events.`,
    priority: 'low',
    data: {
      link: '/dashboard',
    },
    actionUrl: '/dashboard',
    icon: getNotificationIcon('welcome'),
  };
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  notification: Notification,
  userId: string
): Promise<void> {
  try {
    // Get user email from Firestore
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.warn('User not found for email notification');
      return;
    }

    const userData = userDoc.data();
    const userEmail = userData.email;
    const userName = userData.displayName || 'User';

    if (!userEmail) {
      console.warn('User email not found');
      return;
    }

    // Send appropriate email based on notification type
    switch (notification.type) {
      case 'welcome':
        await sendWelcomeEmail({
          email: userEmail,
          name: userName,
          role: userData.role || 'volunteer',
        });
        break;
      case 'application_status':
        if (notification.data?.projectName) {
          await sendSubmissionConfirmation({
            email: userEmail,
            name: userName,
            projectName: notification.data.projectName,
            type: 'project',
          });
        }
        break;
      case 'project_update':
        if (notification.message.includes('approved')) {
          await sendApprovalEmail({
            email: userEmail,
            name: userName,
            projectName: notification.data?.projectName || 'Project',
            type: 'project',
          });
        }
        break;
      case 'reminder':
        await sendReminderEmail({
          email: userEmail,
          name: userName,
          projectName: notification.title,
          message: notification.message,
        });
        break;
      default:
        // For other types, we could create a generic notification email
        console.log('No email template for notification type:', notification.type);
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't throw - email failure shouldn't break notification creation
  }
}

