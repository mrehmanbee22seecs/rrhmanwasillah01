# Notification System Documentation

## Overview

The Wasillah notification system provides comprehensive notification functionality including:
- **In-App Notifications**: Real-time notification center with read/unread status
- **Email Notifications**: Automated email notifications for various events
- **Push Notifications**: Browser push notifications via Firebase Cloud Messaging (PWA)

## Features

### 1. In-App Notifications

- Real-time notification center
- Notification types (project updates, applications, messages, reminders, achievements)
- Read/unread status tracking
- Notification preferences
- Notification history
- Mark all as read functionality
- Filter by type or read status

### 2. Email Notifications

- Welcome emails
- Project application updates
- Event reminders
- Achievement notifications
- Weekly digest (optional)
- Email preferences

### 3. Push Notifications (PWA)

- Browser push notifications
- Notification permissions
- Notification settings
- Background notifications
- Notification scheduling

## Architecture

### File Structure

```
src/
├── types/
│   └── notifications.ts          # Notification types and interfaces
├── services/
│   └── notificationService.ts    # Core notification service
├── hooks/
│   └── useNotifications.ts       # React hook for notifications
├── components/
│   ├── NotificationBell.tsx      # Notification bell icon with badge
│   └── NotificationCenter.tsx    # Full notification center UI
├── utils/
│   ├── notificationTemplates.ts  # Notification template generators
│   └── notificationHelpers.ts    # Helper functions for creating notifications
└── config/
    └── firebase.ts               # Firebase config with FCM setup

public/
└── firebase-messaging-sw.js      # Service worker for push notifications
```

### Database Structure

#### Notifications Collection

```typescript
{
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
  data?: {
    link?: string;
    projectId?: string;
    eventId?: string;
    [key: string]: any;
  };
  actionUrl?: string;
  icon?: string;
  imageUrl?: string;
}
```

#### Notification Preferences Collection

```typescript
{
  userId: string;
  inApp: {
    enabled: boolean;
    types: { [key in NotificationType]: boolean };
  };
  email: {
    enabled: boolean;
    types: { [key in NotificationType]: boolean };
    weeklyDigest: boolean;
  };
  push: {
    enabled: boolean;
    types: { [key in NotificationType]: boolean };
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone?: string;
  };
  updatedAt: Timestamp;
}
```

#### Push Notification Tokens Collection

```typescript
{
  userId: string;
  token: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Setup

### 1. Firebase Cloud Messaging Setup

1. **Enable Cloud Messaging in Firebase Console**
   - Go to Firebase Console > Project Settings > Cloud Messaging
   - Generate a Web Push certificate (VAPID key)
   - Copy the key pair

2. **Configure Environment Variables**
   ```env
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

3. **Deploy Service Worker**
   - The service worker is already in `public/firebase-messaging-sw.js`
   - It will be automatically registered when the app loads

### 2. Firestore Security Rules

The security rules for notifications are already included in `firestore.rules`:

```javascript
// Notifications
match /notifications/{notificationId} {
  allow read: if isAuthenticated() && 
    request.auth.uid == resource.data.userId;
  allow create: if isAuthenticated();
  allow update, delete: if isAuthenticated() && 
    request.auth.uid == resource.data.userId;
}

// Notification Preferences
match /notification_preferences/{userId} {
  allow read, write: if isAuthenticated() && 
    request.auth.uid == userId;
  allow read: if isAdmin();
}

// Push Notification Tokens
match /push_notification_tokens/{tokenId} {
  allow read, write: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && 
    request.resource.data.userId == request.auth.uid;
}
```

### 3. Firestore Indexes

Create the following composite indexes in Firebase Console:

**Notifications Collection:**
- Collection: `notifications`
  - Fields: `userId` (Ascending), `createdAt` (Descending)
  - Fields: `userId` (Ascending), `read` (Ascending), `createdAt` (Descending)
  - Fields: `userId` (Ascending), `type` (Ascending), `createdAt` (Descending)

**Push Notification Tokens:**
- Collection: `push_notification_tokens`
  - Fields: `userId` (Ascending), `createdAt` (Descending)

## Usage

### Creating Notifications

#### Using Helper Functions

```typescript
import { sendWelcomeNotification } from '../utils/notificationHelpers';

// Send welcome notification
await sendWelcomeNotification(userId, userName, role);

// Send project update notification
await sendProjectUpdateNotification({
  projectId: 'project123',
  projectName: 'My Project',
  updateType: 'approved',
  userId: 'user123',
  link: '/projects/project123'
});

// Send application status notification
await sendApplicationStatusNotification({
  applicationId: 'app123',
  projectName: 'My Project',
  status: 'approved',
  userId: 'user123',
  link: '/my-applications'
});
```

#### Using Service Directly

```typescript
import { createNotification } from '../services/notificationService';
import { createProjectUpdateNotification } from '../utils/notificationTemplates';

const notification = createProjectUpdateNotification({
  projectId: 'project123',
  projectName: 'My Project',
  updateType: 'approved',
  userId: 'user123',
  link: '/projects/project123'
});

await createNotification('user123', notification);
```

### Using the Notification Hook

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    stats,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotif,
    updatePreferences,
    enablePushNotifications,
  } = useNotifications({ limit: 50, unreadOnly: false });

  // Use notifications...
}
```

### Using Notification Components

```typescript
import NotificationBell from '../components/NotificationBell';
import NotificationCenter from '../components/NotificationCenter';

// NotificationBell is already integrated into Header
// NotificationCenter can be used standalone or within NotificationBell
```

## Integration Points

### 1. User Registration

Welcome notifications are automatically sent when a new user signs up (integrated in `AuthContext.tsx`).

### 2. Project Submissions

Add notification creation when:
- Project is approved/rejected
- Project is updated
- New application is received

Example:
```typescript
import { sendProjectUpdateNotification } from '../utils/notificationHelpers';

// When project is approved
await sendProjectUpdateNotification({
  projectId: project.id,
  projectName: project.name,
  updateType: 'approved',
  userId: project.submittedBy,
  link: `/projects/${project.id}`
});
```

### 3. Application Status Updates

Add notification creation when:
- Application is approved/rejected
- Application status changes

Example:
```typescript
import { sendApplicationStatusNotification } from '../utils/notificationHelpers';

// When application is approved
await sendApplicationStatusNotification({
  applicationId: application.id,
  projectName: application.projectName,
  status: 'approved',
  userId: application.userId,
  link: '/my-applications'
});
```

### 4. Reminders

Add notification creation for reminders (integrate with existing reminder system).

Example:
```typescript
import { sendReminderNotification } from '../utils/notificationHelpers';

// When reminder is due
await sendReminderNotification({
  reminderId: reminder.id,
  title: reminder.title,
  message: reminder.message,
  userId: reminder.userId,
  link: '/reminders'
});
```

## Email Notifications

Email notifications are automatically sent based on user preferences when notifications are created. The email service uses the existing `mailerSendEmailService.ts`.

### Email Templates

- Welcome emails
- Submission confirmations
- Approval notifications
- Reminder emails

## Push Notifications

### Enabling Push Notifications

1. User clicks "Enable" in notification preferences
2. Browser requests permission
3. Token is generated and saved to Firestore
4. User receives push notifications based on preferences

### Sending Push Notifications

Push notifications are sent via Firebase Cloud Functions (to be implemented). The service worker handles background notifications and notification clicks.

### Testing Push Notifications

1. Enable push notifications in the app
2. Use Firebase Console > Cloud Messaging to send test messages
3. Or use the FCM Admin SDK in a Cloud Function

## Notification Types

- `project_update`: Project status updates
- `application_status`: Application status changes
- `message`: New messages
- `reminder`: Reminders
- `achievement`: Achievements unlocked
- `event_reminder`: Event reminders
- `project_application`: New project applications
- `system`: System notifications
- `welcome`: Welcome notifications

## Best Practices

1. **Don't spam users**: Respect notification preferences and quiet hours
2. **Provide context**: Include relevant links and data in notifications
3. **Handle errors gracefully**: Notification failures shouldn't break user flows
4. **Clean up old notifications**: Implement periodic cleanup of old read notifications
5. **Test thoroughly**: Test all notification types and delivery methods

## Troubleshooting

### Push Notifications Not Working

1. Check if VAPID key is configured in `.env`
2. Verify service worker is registered (check browser console)
3. Check browser notification permissions
4. Verify Firebase Cloud Messaging is enabled in Firebase Console
5. Check browser console for errors

### Email Notifications Not Sending

1. Check if MailerSend is configured (see `mailerSendEmailService.ts`)
2. Verify user email preferences are enabled
3. Check MailerSend API logs
4. Verify email service is not disabled

### Notifications Not Appearing

1. Check Firestore security rules
2. Verify user is authenticated
3. Check Firestore indexes are created
4. Verify notification preferences are set correctly
5. Check browser console for errors

## Future Enhancements

- [ ] Cloud Function for sending push notifications
- [ ] Notification scheduling
- [ ] Notification grouping
- [ ] Rich notifications with images
- [ ] Notification sounds
- [ ] SMS notifications
- [ ] Notification analytics
- [ ] A/B testing for notification content

## Support

For issues or questions, please check:
1. Firebase Console logs
2. Browser console errors
3. Firestore security rules
4. Network tab for API calls

## License

This notification system is part of the Wasillah project.

