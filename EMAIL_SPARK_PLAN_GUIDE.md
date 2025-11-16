# Email System - Firebase Spark Plan Compatible Guide

## ✅ **YES - Fully Compatible with Spark Plan**

The email system has been redesigned to work entirely on Firebase Spark (free) plan without requiring Cloud Functions.

## 📊 Overview

All email functionality now works **client-side** using the Resend API directly from the browser. This eliminates the need for Firebase Cloud Functions (which require Blaze plan) while maintaining full email functionality.

## 🎯 What Changed

### Before (Required Blaze Plan)
- Email sending via Firebase Cloud Functions
- Firestore triggers (onCreate, onUpdate) in Cloud Functions
- Scheduled functions for reminders
- Required Blaze plan to deploy

### After (Spark Plan Compatible)
- Email sending directly from client using Resend API
- Emails sent immediately after user actions (submission, approval, etc.)
- Client-side reminder checking with periodic polling
- Works on FREE Spark plan ✅

## 🔧 How It Works

### 1. Submission Emails
**When:** User submits a project or event

**Flow:**
1. User fills form and clicks submit
2. Data is saved to Firestore
3. Client immediately calls Resend API to send confirmation email
4. User sees confirmation and receives email

**Code Location:** `src/pages/CreateSubmission.tsx` (line ~754)

```typescript
// Send confirmation email after successful submission
await sendEmail(formatSubmissionReceivedEmail({
  type: submissionType,
  title: projectData.title,
  submitterName: userData.displayName,
  submitterEmail: userData.email,
  // ...
}));
```

### 2. Approval/Rejection Emails
**When:** Admin approves or rejects a submission

**Flow:**
1. Admin clicks approve/reject button
2. Submission status is updated in Firestore
3. Client immediately calls Resend API to send notification email
4. User receives approval/rejection email

**Code Location:** `src/components/AdminPanel.tsx` (line ~539)

```typescript
// Send email notification to user after status update
await sendEmail(formatSubmissionStatusUpdateEmail({
  type: submissionType,
  title: submission.title,
  submitterEmail: submission.submitterEmail,
  status: status as 'approved' | 'rejected',
  // ...
}));
```

### 3. Welcome Emails
**When:** New user signs up

**Flow:**
1. User completes registration
2. User document is created in Firestore
3. Client immediately calls Resend API to send welcome email
4. User receives role-specific welcome email

**Code Location:** `src/contexts/AuthContext.tsx` (line ~246)

```typescript
// Send welcome email after user signup
await sendWelcomeEmail({
  email: email,
  name: displayName,
  role: userRole
});
```

### 4. Edit Request Emails
**When:** User requests to edit their submission

**Flow:**
1. User submits edit request
2. Edit request is saved to Firestore
3. Client immediately sends confirmation email
4. When admin approves/rejects, client sends status email

**Code Locations:**
- Request: `src/pages/CreateSubmission.tsx` (line ~573)
- Approval: `src/components/AdminPanel.tsx` (line ~717)
- Rejection: `src/components/AdminPanel.tsx` (line ~760)

### 5. Reminder Emails
**When:** Scheduled reminder time arrives

**Flow:**
1. User creates reminder with scheduled time
2. RemindersPanel component checks for due reminders every 5 minutes
3. When reminder is due, client sends email via Resend API
4. Reminder is marked as sent

**Code Location:** `src/services/clientSideReminderService.ts`

**How to trigger:**
- Automatic: Opens dashboard → checks every 5 minutes
- Manual: Click "Check for Due Reminders" button

## 📧 Email Service Architecture

### Client-Side Services

#### 1. `resendEmailService.ts`
Main email service using Resend API:
- `sendWelcomeEmail()` - Welcome emails with role-specific content
- `sendSubmissionConfirmation()` - Submission received emails
- `sendApprovalEmail()` - Approval notification emails
- `sendReminderEmail()` - Scheduled reminder emails
- `sendVolunteerConfirmation()` - Volunteer registration emails
- `sendEditRequestEmail()` - Edit request confirmation
- `sendEditRequestStatusEmail()` - Edit request approval/rejection

#### 2. `clientSideReminderService.ts`
Reminder checking service (replaces Cloud Functions):
- `checkDueReminders()` - Checks all reminders and sends due ones
- `sendReminderNow()` - Manually sends a specific reminder

#### 3. `emailService.ts`
Legacy service with email templates (used for formatting)

## 🔐 Security Considerations

### API Key Exposure
⚠️ **Important:** The Resend API key is in client-side code, which means it's visible in the browser.

**Mitigation:**
1. **Domain Restrictions** (Recommended):
   - Go to [Resend Dashboard](https://resend.com/api-keys)
   - Edit your API key
   - Add your domain to "Allowed domains"
   - Only requests from your domain will work

2. **Rate Limiting** (Built-in):
   - Resend free tier: 100 emails/day
   - Prevents abuse even if key is compromised

3. **Monitoring** (Recommended):
   - Check Resend dashboard regularly
   - Set up email alerts for unusual activity
   - Rotate API key if needed

### Best Practices
- ✅ Use environment variables for API key
- ✅ Keep sender email consistent (`noreply@wasillah.live`)
- ✅ Add domain restrictions in Resend dashboard
- ✅ Monitor email usage regularly
- ✅ Don't commit `.env` file with real keys

## 🚀 Setup Instructions

### 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com/)
2. Verify your domain `wasillah.live` (or use `onboarding@resend.dev` for testing)
3. Create an API key
4. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables
Create `.env` file in project root:

```env
# Resend Configuration
VITE_RESEND_API_KEY=re_YOUR_API_KEY_HERE
VITE_RESEND_SENDER_EMAIL=noreply@wasillah.live

# Or use test email for development:
# VITE_RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### 3. Add Domain Restrictions
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click on your API key
3. Under "Security", add your domains:
   - `wasillah.live`
   - `*.wasillah.live`
   - `localhost` (for development)

### 4. Test Email Functionality
1. Sign up as a new user → Check for welcome email
2. Submit a project → Check for confirmation email
3. Have admin approve it → Check for approval email
4. Create a reminder → Check if it sends at scheduled time

## 📊 Spark Plan Limits

### Firebase Spark Plan
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Functions**: ❌ Not available (we don't need them!)

### Resend Free Tier
- **Emails**: 100 emails/day
- **Rate Limit**: 10 emails/second
- **Recipients**: 1 per email
- **Perfect for:** Small to medium apps, development, MVP

### Estimated Usage
For 50 active users per day:
- Submissions: ~10 emails/day
- Approvals: ~5 emails/day
- Reminders: ~5 emails/day
- Welcome emails: ~2 emails/day
- **Total: ~22 emails/day** (well within 100/day limit)

## 🎉 Benefits of Client-Side Approach

### Advantages
- ✅ **No Cloud Functions** - Works on FREE Spark plan
- ✅ **Immediate delivery** - No waiting for triggers
- ✅ **Simple debugging** - All code in one place
- ✅ **Real-time feedback** - User sees status immediately
- ✅ **Cost-effective** - Completely free (within limits)

### Considerations
- ⚠️ **API key visible** - Need domain restrictions
- ⚠️ **Client dependency** - Requires user to be online
- ⚠️ **Rate limits** - 100 emails/day on free tier
- ℹ️ **Reminder checking** - Requires dashboard visit (every 5 min)

## 🔧 Troubleshooting

### Emails Not Sending
1. **Check API Key**
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_RESEND_API_KEY)
   ```
   Should output your API key (starts with `re_`)

2. **Check Sender Email**
   - Must be verified domain or `onboarding@resend.dev`
   - Check in `.env`: `VITE_RESEND_SENDER_EMAIL`

3. **Check Console Errors**
   - Open browser DevTools → Console tab
   - Look for Resend API errors
   - Common: 401 (invalid key), 403 (domain not allowed)

4. **Check Resend Dashboard**
   - Go to [resend.com/logs](https://resend.com/logs)
   - View recent email attempts
   - Check for failures and reasons

### Reminders Not Sending
1. **Open Dashboard**
   - Reminder checking only works when dashboard is open
   - Checks every 5 minutes automatically

2. **Manual Check**
   - Click "Check for Due Reminders" button
   - Check console for errors

3. **Verify Reminder Data**
   - Go to Firestore → `reminders` collection
   - Check `scheduledAt` field is correct
   - Check `sent` field is false

### Rate Limit Exceeded
1. **Check Usage**
   - Resend dashboard → Usage tab
   - See how many emails sent today

2. **Upgrade Plan**
   - If consistently hitting 100/day limit
   - Consider Resend paid plan ($20/month for 50K emails)

3. **Optimize**
   - Reduce reminder frequency
   - Batch notifications where possible
   - Use in-app notifications instead

## 📈 Scaling Considerations

### When to Upgrade Resend Plan
- You're consistently hitting 100 emails/day
- You need priority support
- You want email analytics
- You need higher rate limits

### When to Upgrade Firebase Plan
- You exceed Firestore 50K reads/day
- You need more than 20K writes/day
- You want scheduled functions (auto reminder checking)
- You need increased bandwidth

### Cost Example (Blaze Plan)
If you upgrade to Blaze for scheduled functions:
- **Scheduled reminder check**: Every 5 minutes = 8,640 calls/month
- **Cost**: ~$0.01-0.05/month (extremely low)
- **Benefit**: Automatic reminder checking (no dashboard needed)

## 📝 Summary

### ✅ What Works on Spark Plan
- Welcome emails on user signup
- Submission confirmation emails
- Approval/rejection notification emails
- Edit request emails
- Reminder emails (with manual/periodic checking)
- Volunteer confirmation emails
- All email templates and styling

### ✨ Key Features
- No Cloud Functions required
- Immediate email delivery
- Real-time user feedback
- Role-specific welcome emails
- Professional HTML email templates
- Edit request workflow with emails
- Reminder system with client-side checking

### 🎯 Perfect For
- Development and testing
- Small to medium apps (< 1000 users)
- MVP launches
- Spark plan projects
- Budget-conscious projects

### 💰 Total Cost
- **Firebase Spark Plan**: $0/month
- **Resend Free Tier**: $0/month (100 emails/day)
- **Total**: **$0/month** 🎉

## 🔗 Resources

- [Firebase Spark Plan Limits](https://firebase.google.com/pricing)
- [Resend Documentation](https://resend.com/docs)
- [Resend API Keys Management](https://resend.com/api-keys)
- [Email Templates Guide](./EMAIL_SYSTEM_README.md)

## 🆘 Need Help?

1. Check browser console for errors
2. Check Resend dashboard logs
3. Verify `.env` configuration
4. Review code in `src/services/resendEmailService.ts`
5. Check this guide's troubleshooting section

---

**Status**: ✅ Fully Implemented and Tested
**Compatibility**: Firebase Spark Plan (Free)
**Email Provider**: Resend (Free tier: 100 emails/day)
**Last Updated**: November 2024
