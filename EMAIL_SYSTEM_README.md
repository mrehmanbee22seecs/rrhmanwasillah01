# Wasillah Email Automation System

Complete email automation system for the Wasillah platform, handling transactional emails and scheduled reminders.

## Overview

Wasillah is a Firebase + Firestore web application that manages users, project/event submissions, and volunteer sign-ups. This email automation system provides:

- **Welcome emails** when users sign up
- **Submission confirmations** for projects and events
- **Approval notifications** when admins approve submissions
- **Custom reminders** that users can schedule
- **Volunteer confirmations** for "Join Us" form submissions
- **Password reset emails** via Firebase Auth

## Features

### 1. Welcome Email (User Signup)
- Automatically sent when a user signs up via Firebase Auth
- Personalized with user's display name
- Includes verification email from Firebase Auth
- Delivered via MailerSend API

### 2. Submission Confirmation (Projects/Events)
- Sent immediately when user submits a project or event
- Confirms receipt and notifies user it's under review
- Triggered by Firebase Functions on document creation

### 3. Admin Approval Notification
- Sent when admin approves a project/event in Firestore
- Updates user that their submission is now live
- Triggered by Firebase Functions on document update

### 4. Custom Reminders
- Users can create personalized reminders for projects/events
- Includes: name, project name, custom message, date & time
- Scheduled using Upstash QStash (optional) or Firebase scheduled functions
- Emails sent at the specified time

### 5. Volunteer Form Confirmation
- Sent when user submits the "Join Us" volunteer form
- Thanks them for volunteering
- Stored in Firestore `volunteer_applications` collection

### 6. Password Reset
- Handled automatically by Firebase Auth's `sendPasswordResetEmail()`
- Frontend integration in AuthContext

## Services Used

| Function | Service | Plan |
|----------|---------|------|
| Database | Firestore (Firebase) | Spark (Free) |
| Authentication | Firebase Auth | Spark (Free) |
| Email Sending | MailerSend API | Free tier (100 emails/day) |
| Scheduling | Upstash QStash (optional) | Free tier (500 messages/day) |
| Backend | Firebase Functions | Spark (Free for basic usage) |
| Hosting | Firebase Hosting | Spark (Free) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vite + React)                 │
├─────────────────────────────────────────────────────────────┤
│  - AuthContext (signup → welcome email)                     │
│  - Volunteer Page (form → confirmation email)               │
│  - ReminderForm (create reminder)                           │
│  - Dashboard (mailersend verification)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                           │
├─────────────────────────────────────────────────────────────┤
│  - mailersendEmailService.ts (email templates)                  │
│  - reminderService.ts (scheduling logic)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Functions                        │
├─────────────────────────────────────────────────────────────┤
│  - onProjectSubmissionCreate (confirmation)                 │
│  - onEventSubmissionCreate (confirmation)                   │
│  - onProjectStatusChange (approval)                         │
│  - onEventStatusChange (approval)                           │
│  - sendDueReminders (every 5 min)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 External Services                            │
├─────────────────────────────────────────────────────────────┤
│  - MailerSend API (email delivery)                              │
│  - Upstash QStash (optional scheduling)                     │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd rrhmanwasi
```

### 2. Install Dependencies

```bash
# Install main project dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 3. Configure Firebase Project

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google, Facebook)
3. Create Firestore database
4. Update `src/config/firebase.ts` with your Firebase config

### 4. Set Up MailerSend

1. Sign up at [https://www.mailersend.com](https://www.mailersend.com)
2. Verify your domain (or use their test domain for development)
3. Get your API key from the dashboard
4. Update `SENDER_EMAIL` in code files to match your verified domain

### 5. Set Up Upstash QStash (Optional)

1. Sign up at [https://upstash.com](https://upstash.com)
2. Create a QStash project
3. Get your QStash token from the dashboard
4. Configure callback URL for your deployed application

### 6. Configure Environment Variables

Create `.env.local` in the project root:

```bash
VITE_MAILERSEND_API_KEY=re_xxxxxxxxxxxxx
VITE_QSTASH_TOKEN=qstash_xxxxxxxxxxxxx
```

Create `.env` in the `functions` directory:

```bash
MAILERSEND_API_KEY=re_xxxxxxxxxxxxx
```

### 7. Deploy Firebase Functions (Optional for Spark Plan)

**Note:** Firebase Functions require the Blaze (pay-as-you-go) plan for deployment. However, the system works on Spark (free) plan with client-side email sending.

To deploy functions:

```bash
# Upgrade to Blaze plan
firebase projects:list
firebase upgrade

# Deploy functions
firebase deploy --only functions
```

### 8. Run Locally

```bash
# Start development server
npm run dev

# Open browser
# http://localhost:5173
```

### 9. Deploy to Firebase Hosting

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Environment Variables

### Frontend (.env.local)

```bash
VITE_MAILERSEND_API_KEY=re_xxxxxxxxxxxxx     # Your MailerSend API key
VITE_QSTASH_TOKEN=qstash_xxxxxxxxxxxxx   # Your QStash token (optional)
```

### Firebase Functions (functions/.env)

```bash
MAILERSEND_API_KEY=re_xxxxxxxxxxxxx          # Your MailerSend API key
```

## Firestore Schema

### reminders collection

```typescript
{
  id: string;
  email: string;
  name: string;
  projectName: string;
  message: string;
  scheduledAt: string;        // ISO timestamp
  userId?: string;
  sent: boolean;
  createdAt: Timestamp;
  sentAt?: Timestamp;
  qstashMessageId?: string;
}
```

### volunteer_applications collection

```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: string;
  city: string;
  occupation?: string;
  experience: string;
  skills: string[];
  interests: string[];
  availability: string;
  motivation: string;
  submittedAt: Timestamp;
}
```

### project_submissions collection

```typescript
{
  title: string;
  submitterEmail: string;
  submitterName: string;
  status: 'pending' | 'approved' | 'rejected';
  // ... other fields
}
```

### event_submissions collection

```typescript
{
  title: string;
  submitterEmail: string;
  submitterName: string;
  status: 'pending' | 'approved' | 'rejected';
  // ... other fields
}
```

## Testing

### Test Welcome Email

1. Go to signup page
2. Create a new account with email and password
3. Check email inbox for:
   - Firebase verification email
   - Welcome email from MailerSend

### Test Submission Confirmation

1. Login to the application
2. Submit a new project or event
3. Check email for submission confirmation

### Test Approval Email

1. Login as admin (admin@wasilah.org)
2. Go to admin dashboard
3. Approve a pending project/event
4. Check submitter's email for approval notification

### Test Custom Reminder

1. Login to the application
2. Navigate to reminder form (or dashboard)
3. Fill in reminder details with future date/time
4. Submit form
5. Wait for scheduled time (or use Firebase console to check reminder document)
6. Check email at scheduled time

### Test Volunteer Form

1. Go to "Join Us" / Volunteer page
2. Fill out the volunteer form
3. Submit
4. Check email for confirmation
5. Verify data is stored in Firestore `volunteer_applications` collection

### Test Password Reset

1. Go to login page
2. Click "Forgot Password"
3. Enter email address
4. Check email for reset link
5. Follow link to reset password

## File Structure

```
/
├── src/
│   ├── components/
│   │   └── ReminderForm.tsx           # Reminder creation form
│   ├── contexts/
│   │   └── AuthContext.tsx            # Auth with welcome email
│   ├── pages/
│   │   ├── Volunteer.tsx              # Volunteer form with confirmation
│   │   └── Dashboard.tsx              # User dashboard
│   ├── services/
│   │   ├── mailersendEmailService.ts      # MailerSend email templates
│   │   └── reminderService.ts         # Reminder scheduling
│   └── config/
│       └── firebase.ts                # Firebase configuration
├── functions/
│   ├── emailFunctions.js              # Email automation functions
│   ├── index.js                       # Main functions (chat, etc.)
│   └── package.json                   # Functions dependencies
├── .env.example                       # Example environment variables
├── .env.local                         # Local environment variables (gitignored)
├── firebase.json                      # Firebase configuration
├── firestore.rules                    # Firestore security rules
└── EMAIL_SYSTEM_README.md             # This file
```

## Troubleshooting

### Emails not sending

1. **Check MailerSend API key**: Verify `VITE_MAILERSEND_API_KEY` is set correctly
2. **Check sender email**: Ensure sender email domain is verified in MailerSend
3. **Check console logs**: Look for error messages in browser console
4. **Check MailerSend dashboard**: View email logs and status

### Reminders not sending

1. **Check QStash token**: Verify `VITE_QSTASH_TOKEN` is set (if using QStash)
2. **Check Firestore**: Verify reminder document was created
3. **Check Firebase Functions**: Deploy functions for scheduled reminders
4. **Check time**: Ensure scheduled time is in the future

### Welcome email not sending

1. **Check signup flow**: Ensure `sendWelcomeEmail` is called in AuthContext
2. **Check user data**: Verify email and displayName are set
3. **Check MailerSend logs**: Look for email in MailerSend dashboard

### Firebase Functions not working

1. **Check Blaze plan**: Functions require pay-as-you-go plan
2. **Check deployment**: Ensure functions are deployed with `firebase deploy --only functions`
3. **Check environment variables**: Set `MAILERSEND_API_KEY` in functions environment
4. **Check logs**: View function logs with `firebase functions:log`

## Security Notes

- Never commit `.env.local` or API keys to version control
- Use Firebase Security Rules to protect Firestore collections
- Validate all user input before creating reminders
- Rate limit reminder creation to prevent abuse
- Use HTTPS only for all API requests
- Verify sender email domain in MailerSend to prevent spoofing

## Cost Considerations

### Free Tier Limits

- **MailerSend**: 100 emails/day, 3,000 emails/month
- **Upstash QStash**: 500 messages/day
- **Firebase Spark**: Limited function invocations, 10 GB storage
- **Firestore**: 50K reads, 20K writes, 20K deletes per day

### Recommendations

- Start on free tiers for testing
- Monitor usage in dashboards
- Upgrade to paid plans as needed
- Implement rate limiting to control costs
- Use Firebase Functions scheduled triggers efficiently (every 5 minutes vs every minute)

## Support

For issues or questions:
- Check Firebase Console for errors
- Review MailerSend dashboard for email status
- Check browser console for client-side errors
- Review Firebase Functions logs for server-side errors

## Future Enhancements

- Add email templates customization in admin panel
- Implement email preferences for users
- Add batch email sending for announcements
- Create email analytics dashboard
- Add SMS notifications option
- Implement webhook endpoints for better QStash integration
- Add email queue management
- Create email scheduling UI for admins

## License

This project is part of the Wasillah platform.
