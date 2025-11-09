# Notification System Testing Guide

## Prerequisites

1. **Firebase Setup**
   - Ensure Firebase project is configured
   - Firestore database is created
   - Security rules are deployed
   - Indexes are created (see NOTIFICATION_SYSTEM_README.md)

2. **Environment Variables**
   ```env
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

3. **Service Worker**
   - Service worker should be registered automatically
   - Check browser console for registration status

## Testing Checklist

### 1. In-App Notifications

#### ✅ Notification Bell Visibility
- [ ] Notification bell appears in header for authenticated users
- [ ] Notification bell shows unread count badge
- [ ] Badge updates in real-time when new notifications arrive
- [ ] Badge is hidden when there are no unread notifications

#### ✅ Notification Center
- [ ] Clicking notification bell opens notification center
- [ ] Notification center displays list of notifications
- [ ] Notifications are sorted by date (newest first)
- [ ] Unread notifications are highlighted
- [ ] Can filter notifications by type
- [ ] Can filter notifications by read/unread status
- [ ] Can mark individual notifications as read
- [ ] Can mark all notifications as read
- [ ] Can delete notifications
- [ ] Notification center closes when clicking outside
- [ ] Clicking notification navigates to action URL

#### ✅ Real-Time Updates
- [ ] New notifications appear instantly without page refresh
- [ ] Unread count updates in real-time
- [ ] Notification list updates when notifications are marked as read
- [ ] Notification list updates when notifications are deleted

### 2. Welcome Notifications

#### ✅ New User Registration
- [ ] Create a new user account
- [ ] Check that welcome notification is created
- [ ] Verify notification appears in notification center
- [ ] Verify notification has correct type (welcome)
- [ ] Verify notification has correct message
- [ ] Check that notification is unread by default

### 3. Project Update Notifications

#### ✅ Project Approval
- [ ] Create a project submission
- [ ] Approve the project as admin
- [ ] Verify project owner receives notification
- [ ] Verify notification type is 'project_update'
- [ ] Verify notification message indicates approval
- [ ] Verify notification has link to project

#### ✅ Project Rejection
- [ ] Create a project submission
- [ ] Reject the project as admin
- [ ] Verify project owner receives notification
- [ ] Verify notification message indicates rejection

#### ✅ New Application
- [ ] Submit application to a project
- [ ] Verify project owner receives notification
- [ ] Verify notification type is 'project_application'
- [ ] Verify notification includes applicant name

### 4. Application Status Notifications

#### ✅ Application Approval
- [ ] Submit an application
- [ ] Approve the application as admin
- [ ] Verify applicant receives notification
- [ ] Verify notification type is 'application_status'
- [ ] Verify notification message indicates approval

#### ✅ Application Rejection
- [ ] Submit an application
- [ ] Reject the application as admin
- [ ] Verify applicant receives notification
- [ ] Verify notification message indicates rejection

### 5. Notification Preferences

#### ✅ View Preferences
- [ ] Open notification center
- [ ] Click settings/preferences icon
- [ ] Verify preferences panel is displayed
- [ ] Verify current preferences are shown

#### ✅ Update Preferences
- [ ] Toggle email notifications on/off
- [ ] Toggle push notifications on/off
- [ ] Toggle weekly digest on/off
- [ ] Verify preferences are saved
- [ ] Verify preferences persist after page refresh

### 6. Email Notifications

#### ✅ Welcome Email
- [ ] Create a new user account
- [ ] Verify welcome email is sent (check MailerSend logs)
- [ ] Verify email contains correct information
- [ ] Verify email has correct styling

#### ✅ Project Update Email
- [ ] Approve a project
- [ ] Verify project owner receives email
- [ ] Verify email contains project details
- [ ] Verify email has correct link

#### ✅ Application Status Email
- [ ] Approve an application
- [ ] Verify applicant receives email
- [ ] Verify email contains application details

#### ✅ Email Preferences
- [ ] Disable email notifications in preferences
- [ ] Trigger a notification
- [ ] Verify email is NOT sent
- [ ] Re-enable email notifications
- [ ] Trigger a notification
- [ ] Verify email IS sent

### 7. Push Notifications

#### ✅ Enable Push Notifications
- [ ] Open notification preferences
- [ ] Click "Enable" for push notifications
- [ ] Verify browser permission dialog appears
- [ ] Grant permission
- [ ] Verify push notifications are enabled
- [ ] Verify token is saved to Firestore

#### ✅ Receive Push Notifications
- [ ] Ensure push notifications are enabled
- [ ] Trigger a notification (e.g., approve project)
- [ ] Verify browser push notification appears
- [ ] Verify notification has correct title and message
- [ ] Verify notification has correct icon

#### ✅ Background Notifications
- [ ] Close browser tab
- [ ] Trigger a notification
- [ ] Verify push notification appears even when tab is closed
- [ ] Click on notification
- [ ] Verify browser opens to correct URL

#### ✅ Push Notification Preferences
- [ ] Disable push notifications for specific types
- [ ] Trigger notification of that type
- [ ] Verify push notification is NOT sent
- [ ] Enable push notifications for that type
- [ ] Trigger notification
- [ ] Verify push notification IS sent

### 8. Notification Statistics

#### ✅ View Stats
- [ ] Open notification center
- [ ] Verify total notification count is correct
- [ ] Verify unread count is correct
- [ ] Verify counts by type are accurate

### 9. Error Handling

#### ✅ Network Errors
- [ ] Disable network connection
- [ ] Try to mark notification as read
- [ ] Verify error is handled gracefully
- [ ] Verify user sees appropriate error message

#### ✅ Permission Denied
- [ ] Try to access another user's notifications
- [ ] Verify access is denied
- [ ] Verify appropriate error is shown

#### ✅ Invalid Data
- [ ] Try to create notification with invalid data
- [ ] Verify error is handled gracefully
- [ ] Verify appropriate error message is shown

### 10. Performance

#### ✅ Load Time
- [ ] Open notification center
- [ ] Verify notifications load quickly (< 1 second)
- [ ] Verify no lag when scrolling through notifications

#### ✅ Real-Time Updates
- [ ] Verify real-time updates don't cause performance issues
- [ ] Verify unread count updates smoothly
- [ ] Verify notification list updates smoothly

## Manual Testing Steps

### Test 1: Complete Notification Flow

1. **Create New User**
   ```
   - Sign up with new email
   - Verify welcome notification appears
   - Verify welcome email is sent
   ```

2. **Submit Project**
   ```
   - Create project submission
   - Verify submission confirmation (if implemented)
   ```

3. **Approve Project**
   ```
   - As admin, approve the project
   - Verify project owner receives notification
   - Verify project owner receives email
   - Verify push notification (if enabled)
   ```

4. **Apply to Project**
   ```
   - As different user, apply to the project
   - Verify project owner receives notification
   ```

5. **Approve Application**
   ```
   - As admin/project owner, approve application
   - Verify applicant receives notification
   - Verify applicant receives email
   ```

### Test 2: Notification Preferences

1. **Disable Email Notifications**
   ```
   - Open notification preferences
   - Disable email notifications
   - Trigger a notification
   - Verify email is NOT sent
   - Verify in-app notification IS created
   ```

2. **Disable Push Notifications**
   ```
   - Open notification preferences
   - Disable push notifications
   - Trigger a notification
   - Verify push notification is NOT sent
   - Verify in-app notification IS created
   ```

3. **Disable In-App Notifications**
   ```
   - Open notification preferences
   - Disable in-app notifications for a specific type
   - Trigger notification of that type
   - Verify in-app notification is NOT created
   - Verify email/push notifications still work
   ```

### Test 3: Real-Time Updates

1. **Open Notification Center**
   ```
   - Open notification center in one browser tab
   - In another tab/browser, trigger a notification
   - Verify notification appears instantly in first tab
   - Verify unread count updates instantly
   ```

2. **Mark as Read**
   ```
   - Mark notification as read in one tab
   - Verify notification is marked as read in other tabs
   - Verify unread count updates in all tabs
   ```

### Test 4: Push Notifications

1. **Enable Push Notifications**
   ```
   - Open notification preferences
   - Click "Enable" for push notifications
   - Grant browser permission
   - Verify push notifications are enabled
   ```

2. **Receive Push Notification**
   ```
   - Close browser tab
   - Trigger a notification
   - Verify push notification appears
   - Click on notification
   - Verify browser opens to correct URL
   ```

## Automated Testing (Future)

### Unit Tests
- [ ] Test notification service functions
- [ ] Test notification hook
- [ ] Test notification components
- [ ] Test notification templates

### Integration Tests
- [ ] Test notification creation flow
- [ ] Test real-time updates
- [ ] Test notification preferences
- [ ] Test email sending
- [ ] Test push notifications

### E2E Tests
- [ ] Test complete notification flow
- [ ] Test notification preferences
- [ ] Test push notifications
- [ ] Test email notifications

## Troubleshooting

### Notifications Not Appearing

1. **Check Firestore**
   - Verify notifications are being created in Firestore
   - Check Firestore console for errors
   - Verify security rules allow read/write

2. **Check Real-Time Subscription**
   - Open browser console
   - Check for subscription errors
   - Verify user is authenticated
   - Verify user ID matches notification userId

3. **Check Component**
   - Verify NotificationBell is rendered
   - Verify NotificationCenter is rendered
   - Check for React errors in console

### Push Notifications Not Working

1. **Check Service Worker**
   - Verify service worker is registered
   - Check browser console for registration errors
   - Verify service worker file exists

2. **Check VAPID Key**
   - Verify VAPID key is set in .env
   - Verify VAPID key is correct
   - Check Firebase Console for key

3. **Check Permissions**
   - Verify browser notification permissions are granted
   - Check browser settings
   - Try revoking and re-granting permissions

### Email Notifications Not Sending

1. **Check MailerSend**
   - Verify MailerSend is configured
   - Check MailerSend API key
   - Check MailerSend logs
   - Verify email service is enabled

2. **Check Preferences**
   - Verify email notifications are enabled in preferences
   - Verify specific notification type is enabled
   - Check user email address is valid

## Test Data

### Create Test Notifications

You can create test notifications using the browser console:

```javascript
// Import notification helpers
import { sendWelcomeNotification } from './utils/notificationHelpers';

// Create welcome notification
await sendWelcomeNotification('user-id', 'Test User', 'volunteer');

// Create project update notification
import { sendProjectUpdateNotification } from './utils/notificationHelpers';
await sendProjectUpdateNotification({
  projectId: 'test-project-id',
  projectName: 'Test Project',
  updateType: 'approved',
  userId: 'user-id',
  link: '/projects/test-project-id'
});
```

## Success Criteria

All tests should pass:
- ✅ Notifications appear in real-time
- ✅ Email notifications are sent when enabled
- ✅ Push notifications work when enabled
- ✅ Preferences are saved and respected
- ✅ No errors in console
- ✅ Performance is acceptable
- ✅ Error handling works correctly

## Notes

- Push notifications require HTTPS in production
- Service worker must be served from root domain
- VAPID key must be configured for push notifications
- Email notifications require MailerSend configuration
- Real-time updates require Firestore indexes

