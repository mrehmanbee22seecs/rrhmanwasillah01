# Resend Email Migration Guide

## Overview
This document outlines the complete migration from MailerSend to Resend for email delivery in the Wasillah platform.

## What Changed

### 1. Email Service Provider
- **Before**: MailerSend
- **After**: Resend (resend.com)

### 2. Files Modified

#### Frontend (src/)
- **New**: `src/services/resendEmailService.ts` - Main email service using Resend API
- **Updated**: All files that imported from `mailerSendEmailService.ts`:
  - `src/utils/notificationTemplates.ts`
  - `src/services/reminderService.ts`
  - `src/pages/Volunteer.tsx`
  - `src/contexts/AuthContext.tsx`

#### Backend (functions/)
- **Updated**: `functions/emailFunctions.js` - Firebase Cloud Functions now use Resend
- **Updated**: `functions/package.json` - Added Resend dependency

#### API (api/)
- **Updated**: `api/send-reminder.js` - Serverless function for reminders now uses Resend
- **Updated**: `api/package.json` - Added Resend dependency

#### Configuration
- **Updated**: `.env.example` - New environment variables for Resend
- **Updated**: `firestore.indexes.json` - Added index for reminders collection

### 3. Package Changes

#### Packages Added
- `resend` - Official Resend SDK for Node.js

#### Packages Removed
- `mailersend` - No longer needed (can be safely removed from package-lock.json)

## Configuration

### Environment Variables

#### Required Variables
```bash
# Resend API Key (for email sending)
VITE_RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
```

#### Optional Variables
```bash
# Custom sender email (defaults to onboarding@resend.dev)
VITE_RESEND_SENDER_EMAIL=your-verified-email@yourdomain.com
RESEND_SENDER_EMAIL=your-verified-email@yourdomain.com
```

### Firebase Configuration

The following environment variables are still required for Firebase integration:
```bash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key_here
```

## Email Features

All existing email functionality has been preserved:

### 1. Welcome Emails
- Sent when users sign up
- Role-specific content (student, NGO, volunteer, admin)
- **Function**: `sendWelcomeEmail()`

### 2. Submission Confirmations
- Sent when projects/events are submitted
- **Function**: `sendSubmissionConfirmation()`

### 3. Approval Notifications
- Sent when projects/events are approved
- **Function**: `sendApprovalEmail()`

### 4. Reminder Emails
- Scheduled reminders for projects
- **Function**: `sendReminderEmail()`

### 5. Volunteer Confirmations
- Sent when volunteer forms are submitted
- **Function**: `sendVolunteerConfirmation()`

## API Changes

### Resend API Integration

The Resend API uses a simpler interface compared to MailerSend:

```javascript
const { Resend } = require('resend');
const resend = new Resend('your_api_key');

const { data, error } = await resend.emails.send({
  from: 'Wasillah Team <onboarding@resend.dev>',
  to: ['user@example.com'],
  subject: 'Welcome to Wasillah',
  html: '<h1>Welcome!</h1>',
});
```

### Key Differences from MailerSend

| Feature | MailerSend | Resend |
|---------|-----------|--------|
| Initialization | `new MailerSend({ apiKey })` | `new Resend(apiKey)` |
| Sender format | `new Sender(email, name)` | String: `"Name <email>"` |
| Recipients | `new Recipient(email)` | Array of strings: `['email']` |
| Sending | `mailerSend.email.send(emailParams)` | `resend.emails.send({...})` |
| Response | `{ statusCode, body }` | `{ data, error }` |

## Testing

### Manual Testing

A test script has been created to verify email functionality:

```bash
# Set your API key and test email
export RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
export TEST_EMAIL=your-email@example.com

# Run the test
node /tmp/test-email-service.js
```

The test script will:
1. Send a welcome email
2. Send a submission confirmation
3. Send an approval notification
4. Send a reminder email
5. Send a volunteer confirmation

### Integration Testing

To test the full integration:

1. **Test Welcome Email**
   - Sign up as a new user
   - Check email inbox for welcome message

2. **Test Submission Confirmation**
   - Submit a new project or event
   - Check email inbox for confirmation

3. **Test Approval Email**
   - As admin, approve a pending submission
   - Check submitter's email for approval notification

4. **Test Reminder Email**
   - Create a reminder in the system
   - Wait for scheduled time or trigger manually
   - Check email inbox for reminder

5. **Test Volunteer Confirmation**
   - Submit a volunteer form
   - Check email inbox for confirmation

## Deployment Steps

### 1. Update Environment Variables

In your Firebase project:
```bash
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="onboarding@resend.dev"
```

In your frontend deployment (Vercel, Netlify, etc.):
```bash
VITE_RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
VITE_RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### 2. Deploy Firebase Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3. Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Deploy Frontend
```bash
npm install
npm run build
# Deploy to your hosting provider
```

### 5. Deploy API Endpoint
If using Vercel:
```bash
cd api
npm install
cd ..
vercel deploy --prod
```

## Verification

After deployment, verify that:

1. ✅ All environment variables are set correctly
2. ✅ Firebase Functions are deployed successfully
3. ✅ Firestore indexes are created
4. ✅ Test emails are being sent and received
5. ✅ No errors in Firebase Functions logs
6. ✅ No errors in browser console

## Monitoring

### Check Firebase Functions Logs
```bash
firebase functions:log
```

### Check Email Delivery

In the Resend dashboard (resend.com):
1. Navigate to "Emails" section
2. View sent emails and their status
3. Check for any delivery failures

## Rollback Plan

If issues occur, you can rollback by:

1. Revert the git changes:
   ```bash
   git revert <commit-hash>
   ```

2. Restore MailerSend environment variables

3. Redeploy functions and frontend

## Support

For issues or questions:
- Resend Documentation: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference
- Firebase Functions: https://firebase.google.com/docs/functions

## Migration Summary

✅ **Completed**:
- Installed Resend package in all required locations
- Created new Resend email service
- Updated all imports to use new service
- Migrated Firebase functions
- Migrated API endpoints
- Updated environment variable configuration
- Added Firestore index for reminders
- Created test suite
- Documented migration

The migration is complete and ready for deployment!
