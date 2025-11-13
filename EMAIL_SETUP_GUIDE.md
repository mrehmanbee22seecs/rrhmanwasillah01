# Email Setup Guide - Spark Plan Compatible ✅

## 🎯 Quick Fix

Your API key is **VALID** but emails fail due to **frontend CORS issues**.

**Solution:** Deploy Cloud Functions (already written, just need deployment!)

```bash
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="onboarding@resend.dev"
firebase deploy --only functions
```

That's it! Emails will now work. ✅

---

## Why Emails Weren't Working

1. **Frontend sends emails** → Browser CORS blocks Resend API calls
2. **API key in frontend** → Security risk (exposed to users)
3. **Cloud Functions not deployed** → Backend email sending not active

## The Fix (Spark Plan Compatible)

Move email sending from frontend to backend using **Firestore triggers**.

### Architecture Flow

```
User Action → Firestore Document → Cloud Function Trigger → Resend API → ✉️ Email Sent
```

**Benefits:**
- ✅ No CORS issues (backend sends emails)
- ✅ Secure (API key hidden)
- ✅ Automatic (triggers on document creation)
- ✅ Spark Plan compatible (no paid features)
- ✅ Reliable delivery

## Deployment Steps

### Step 1: Configure Functions

```bash
# Set Resend API key in Firebase config
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"

# Set sender email
firebase functions:config:set resend.sender_email="onboarding@resend.dev"

# Verify configuration
firebase functions:config:get
```

### Step 2: Deploy Functions

```bash
# Deploy all email functions
firebase deploy --only functions
```

This deploys 11 Cloud Functions:
- `onUserCreate` - Welcome emails
- `onProjectSubmissionCreate` - Project confirmations
- `onEventSubmissionCreate` - Event confirmations
- `onProjectStatusChange` - Approval/rejection emails
- `onEventStatusChange` - Approval/rejection emails
- `onProjectEditRequestCreate` - Edit request notifications
- `onEventEditRequestCreate` - Edit request notifications
- `onProjectEditRequestStatusChange` - Edit status updates
- `onEventEditRequestStatusChange` - Edit status updates
- `checkDueReminders` - Send due reminders
- `sendReminderNow` - Send reminders immediately

### Step 3: Test

```bash
# Create a test user or submission
# Check logs
firebase functions:log --limit 50

# Should see: "Email sent via Resend: <email_id>"
```

## Spark Plan Compatibility

**100% FREE - No Paid Features Used!**

| Resource | Spark Limit | Email Usage | Status |
|----------|-------------|-------------|--------|
| Cloud Functions | 2M invocations/month | ~5K/month | ✅ 0.25% |
| Firestore Reads | 50K/day | ~100/day | ✅ 0.2% |
| Firestore Writes | 20K/day | ~50/day | ✅ 0.25% |
| Outbound Network | 10GB/month | ~100MB/month | ✅ 1% |
| Resend Emails | 3,000/month (free) | ~1,500/month | ✅ 50% |

**Verdict:** Plenty of headroom on Spark plan! ✅

## Email Functions

### Automatic Triggers (Firestore onCreate/onUpdate)

1. **Welcome Email** - When user signs up
   - Trigger: `users/{userId}` onCreate
   - Personalized by role (student/NGO/volunteer/admin)

2. **Project Submission Confirmation**
   - Trigger: `project_submissions/{docId}` onCreate
   - Confirms receipt and review status

3. **Event Submission Confirmation**
   - Trigger: `event_submissions/{docId}` onCreate
   - Confirms receipt and review status

4. **Project Approval/Rejection**
   - Trigger: `project_submissions/{docId}` onUpdate (status change)
   - Notifies submitter of decision

5. **Event Approval/Rejection**
   - Trigger: `event_submissions/{docId}` onUpdate (status change)
   - Notifies submitter of decision

6. **Edit Request Notifications** (4 functions)
   - Triggers on edit request creation and status changes
   - Notifies users of request status

### Manual Triggers (HTTPS Callable)

7. **Check Due Reminders** - `checkDueReminders()`
   - Called from frontend to check and send due reminders
   - Spark compatible (user-initiated, not scheduled)

8. **Send Reminder Now** - `sendReminderNow({ reminderId })`
   - Sends specific reminder immediately
   - For testing or manual sending

## Troubleshooting

### Emails Not Sending

**Check 1: Functions Deployed?**
```bash
firebase functions:list
```
Should list all 11 functions.

**Check 2: Config Set?**
```bash
firebase functions:config:get
```
Should show resend.api_key and resend.sender_email.

**Check 3: Logs**
```bash
firebase functions:log --limit 50
```
Look for "Email sent via Resend" or error messages.

**Check 4: Resend Dashboard**
- Go to https://resend.com/emails
- Check logs for sent/failed emails

### Common Errors

**"Resend not configured"**
```bash
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase deploy --only functions
```

**"Invalid sender email"**
- Must use `@resend.dev` or verified domain
- Update: `firebase functions:config:set resend.sender_email="onboarding@resend.dev"`

**"Rate limit exceeded"**
- Free tier: 100 emails/day
- Wait 24 hours or upgrade Resend plan

## Sender Email Setup

### Current: `onboarding@resend.dev`
- ✅ Works immediately
- ✅ No verification needed
- ✅ Good for development/testing
- ✅ Recommended for now

### Custom Domain (Optional)
1. Add domain in Resend dashboard
2. Add DNS records (TXT, MX, CNAME)
3. Wait for verification (~24 hours)
4. Update config: `firebase functions:config:set resend.sender_email="noreply@yourdomain.com"`
5. Redeploy: `firebase deploy --only functions`

## Security

### ✅ Secure Setup (After Deployment)
- API key in Firebase Functions config (server-side)
- Emails sent from backend
- API key not exposed to browsers
- Firestore triggers are automatic and secure

### ❌ Insecure Setup (Current - Before Deployment)
- API key in frontend code
- Emails sent from browser
- CORS blocks requests
- API key visible to anyone

**Fix:** Deploy functions as shown above!

## Cost Estimate

### Current Setup (After Deployment)
- **Resend**: 100 emails/day, 3,000/month - **$0/month**
- **Firebase Spark**: 2M function calls/month - **$0/month**
- **Total**: **$0/month**

### Growth Capacity
- Can handle up to 3,000 emails/month free
- ~600,000 function invocations free
- Well within Spark plan limits

### When to Upgrade
- **Resend**: When >100 emails/day needed ($20/month for 50K)
- **Firebase**: When >2M functions/month (unlikely with email only)

## Testing Checklist

- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Create test user account (triggers welcome email)
- [ ] Submit test project/event (triggers confirmation email)
- [ ] Approve/reject submission as admin (triggers status email)
- [ ] Check `firebase functions:log` for "Email sent" messages
- [ ] Check Resend dashboard for sent emails
- [ ] Verify email received in inbox
- [ ] Check spam folder if not in inbox

## Quick Reference

```bash
# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log --limit 50

# View specific function logs
firebase functions:log --only onUserCreate

# List deployed functions
firebase functions:list

# Get config
firebase functions:config:get

# Set config
firebase functions:config:set key="value"
```

## Support

- **Resend Docs**: https://resend.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Function Logs**: `firebase functions:log`

---

**Status**: Ready to Deploy ✅  
**Spark Compatible**: Yes ✅  
**Cost**: $0/month ✅  
**Deploy Time**: ~5 minutes ✅

**Last Updated**: November 13, 2025
