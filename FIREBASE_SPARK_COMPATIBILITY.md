# Firebase Spark Plan Compatibility

## Overview
All email functions in this project are now compatible with the **Firebase Spark (free) plan** by using client-side email sending instead of Cloud Functions.

## Implementation Approach

### Client-Side Email Sending (Current Implementation)
All email functionality has been moved to the client-side using the Resend API directly:

**Advantages:**
- ✅ **No Cloud Functions needed** - Works on Spark plan
- ✅ **Immediate delivery** - Emails sent instantly after user actions
- ✅ **Simple debugging** - All code in client-side JavaScript
- ✅ **Real-time feedback** - Users see confirmation immediately
- ✅ **Cost: $0/month** on Spark plan + Resend free tier

**Implementation:**
1. **Submissions**: Email sent immediately after submission (CreateSubmission.tsx)
2. **Approvals**: Email sent immediately after admin approval (AdminPanel.tsx)
3. **Welcome Emails**: Email sent immediately after signup (AuthContext.tsx)
4. **Edit Requests**: Email sent when request is created/reviewed (CreateSubmission.tsx, AdminPanel.tsx)
5. **Reminders**: Client-side service checks periodically (clientSideReminderService.ts)

## Services

### 1. resendEmailService.ts (Client-Side)
Main email service using Resend API:
- `sendWelcomeEmail()` - Role-specific welcome emails
- `sendSubmissionConfirmation()` - Submission confirmation
- `sendApprovalEmail()` - Approval notifications
- `sendReminderEmail()` - Scheduled reminders
- `sendEditRequestEmail()` - Edit request confirmation
- `sendEditRequestStatusEmail()` - Edit request approval/rejection

### 2. clientSideReminderService.ts (Client-Side)
Replaces Cloud Functions for reminders:
- `checkDueReminders()` - Checks and sends due reminders
- `sendReminderNow()` - Manually sends a reminder
- Called by RemindersPanel every 5 minutes

### 3. emailService.ts (Client-Side)
Email formatting utilities:
- `formatSubmissionReceivedEmail()` - Submission templates
- `formatSubmissionStatusUpdateEmail()` - Status update templates
- Other email formatting functions

## Email Flow Examples

### Example 1: Project Submission
1. User fills form and clicks "Submit"
2. Data saved to `project_submissions` collection
3. **Client immediately calls Resend API** to send confirmation email
4. User sees success message and receives email

### Example 2: Admin Approval
1. Admin clicks "Approve" button
2. Submission status updated to 'approved'
3. **Client immediately calls Resend API** to send approval email
4. User receives notification email

### Example 3: Reminder
1. User creates reminder with future date/time
2. User opens dashboard (any time after scheduled time)
3. **Client-side service checks for due reminders**
4. If reminder is due, **Resend API sends email**
5. Reminder marked as sent

## Firebase Spark Plan Limits

The Spark plan includes:
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users (free)
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Functions**: ❌ Not available on Spark plan

Our client-side approach uses:
- ✅ **Firestore**: Normal read/write operations (within limits)
- ✅ **Authentication**: User management (unlimited)
- ✅ **Hosting**: Static files only (within limits)
- ✅ **No Functions**: All logic runs client-side

## Security Considerations

### API Key in Client Code
⚠️ **Note**: Resend API key is visible in client-side code.

**Mitigation:**
1. **Domain Restrictions** (Recommended):
   - Configure allowed domains in Resend dashboard
   - Only requests from your domain will work
   
2. **Rate Limiting**:
   - Resend free tier: 100 emails/day (built-in protection)
   
3. **Monitoring**:
   - Check Resend dashboard regularly
   - Set up alerts for unusual activity

### Best Practices
- Use environment variables for API key
- Add domain restrictions in Resend
- Monitor email usage regularly
- Rotate API key if compromised

## Setup Instructions

### 1. Configure Resend
1. Sign up at [resend.com](https://resend.com/)
2. Verify domain: `wasillah.live`
3. Get API key
4. Add domain restrictions

### 2. Set Environment Variables
Create `.env` file:
```env
VITE_RESEND_API_KEY=re_YOUR_API_KEY
VITE_RESEND_SENDER_EMAIL=noreply@wasillah.live
```

### 3. Deploy
```bash
# Build the project
npm run build

# Deploy to Firebase Hosting (Spark plan)
firebase deploy --only hosting

# No need to deploy functions!
```

## Email Volume Considerations

With the Resend free tier (100 emails/day) and Firebase Spark plan:

### Estimated Daily Usage
- **50 active users**:
  - Submissions: ~10 emails/day
  - Approvals: ~5 emails/day
  - Reminders: ~5 emails/day
  - Welcome emails: ~2 emails/day
  - **Total: ~22 emails/day** ✅ Well within limits

### If You Need More
Upgrade options:
- **Resend**: $20/month for 50,000 emails
- **Firebase**: Stay on Spark plan (no need to upgrade for emails!)

## Reminder System Details

### How Reminders Work (Spark Compatible)

**Before (Blaze Plan - Scheduled Functions):**
```javascript
// Ran automatically every 5 minutes
exports.sendDueReminders = functions.pubsub.schedule('every 5 minutes').onRun(...)
```

**After (Spark Plan - Client-Side):**
```typescript
// RemindersPanel.tsx - runs when user is on dashboard
useEffect(() => {
  const interval = setInterval(() => {
    checkDueReminders(); // Calls clientSideReminderService
  }, 5 * 60 * 1000); // Every 5 minutes
  return () => clearInterval(interval);
}, []);
```

### Reminder Checking Triggers
1. **Automatic**: When user opens dashboard, checks every 5 minutes
2. **Manual**: "Check for Due Reminders" button
3. **On Page Load**: Checks immediately when RemindersPanel loads

**Limitation**: Requires at least one user to visit dashboard for reminders to send. For mission-critical reminders, consider upgrading to Blaze plan for scheduled functions.

## Troubleshooting

### Emails Not Sending
1. Check browser console for errors
2. Verify `VITE_RESEND_API_KEY` in `.env`
3. Check Resend dashboard logs
4. Verify sender email is verified in Resend
5. Check domain restrictions in Resend settings

### Reminders Not Sending
1. Open dashboard to trigger checking
2. Click "Check for Due Reminders" manually
3. Check browser console for errors
4. Verify reminder `scheduledAt` is in the past
5. Check `sent` field is `false` in Firestore

## Summary

✅ **All email functions are Spark plan compatible**
✅ **No Cloud Functions required**
✅ **Client-side email sending via Resend API**
✅ **Cost: $0/month on Spark plan**
✅ **Works with Resend free tier (100 emails/day)**

### Email Functions Available
- Welcome emails (on signup)
- Submission confirmation emails
- Approval/rejection notification emails
- Edit request emails (confirmation + status)
- Reminder emails (with periodic checking)
- Volunteer confirmation emails

### Key Benefits
- No Cloud Functions deployment needed
- Immediate email delivery
- Real-time user feedback
- Professional HTML templates
- Role-specific content
- Works entirely on FREE Firebase Spark plan

### Important Notes
1. **Resend API key is client-side** - Add domain restrictions in Resend dashboard
2. **Reminders require dashboard visit** - At least one user must be on dashboard for checking
3. **100 emails/day limit** - Resend free tier (upgrade if needed)
4. **No scheduled functions** - All trigger-based, runs when users take actions

The system is designed to work efficiently within free tier limits while providing full functionality! 🎉

## See Also
- [EMAIL_SPARK_PLAN_GUIDE.md](./EMAIL_SPARK_PLAN_GUIDE.md) - Comprehensive guide with examples
- [EMAIL_SYSTEM_README.md](./EMAIL_SYSTEM_README.md) - Email templates and customization
- [RESEND_MIGRATION_GUIDE.md](./RESEND_MIGRATION_GUIDE.md) - Migration from other providers
