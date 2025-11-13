# Resend Email Functionality - Deployment Checklist

## Current Status

The codebase is already configured to use **Resend** for email delivery. The email functions are implemented in `functions/emailFunctions.js` and ready to deploy.

## What You Need to Do to Make Emails Live

### Step 1: Verify Resend API Key ✅ (Already Set)

Your Resend API key is already configured:
- **API Key**: `re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve`
- **Sender Email**: `noreply@wasillah.live`

**Verify the domain is set up in Resend:**
1. Go to [resend.com](https://resend.com) and login
2. Navigate to **Domains** section
3. Verify that `wasillah.live` domain is added and verified
4. If not verified, add DNS records as instructed by Resend

### Step 2: Configure Firebase Functions Environment

Set the Resend configuration in Firebase:

```bash
# Login to Firebase
firebase login

# Select your project
firebase use wasilah-new

# Set environment config
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="noreply@wasillah.live"

# Verify config is set
firebase functions:config:get
```

Expected output:
```json
{
  "resend": {
    "api_key": "re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve",
    "sender_email": "noreply@wasillah.live"
  }
}
```

### Step 3: Install Dependencies

Install required packages in the functions directory:

```bash
cd functions
npm install
cd ..
```

This will install:
- `resend` (v6.4.2) - Email sending library
- `firebase-admin` (v11.8.0) - Firebase Admin SDK
- `firebase-functions` (v4.3.1) - Cloud Functions SDK

### Step 4: Deploy Firebase Functions

Deploy the email functions to Firebase:

```bash
firebase deploy --only functions
```

This will deploy the following email triggers:
- `onProjectSubmissionCreate` - Sends confirmation when project submitted
- `onEventSubmissionCreate` - Sends confirmation when event submitted
- `onProjectStatusChange` - Sends notification when project approved/rejected
- `onEventStatusChange` - Sends notification when event approved/rejected
- `onProjectEditRequestCreate` - Sends confirmation when edit request created
- `onEventEditRequestCreate` - Sends confirmation when edit request created
- `onProjectEditRequestStatusChange` - Sends notification when edit request processed
- `onEventEditRequestStatusChange` - Sends notification when edit request processed
- `onUserCreate` - Sends welcome email when user signs up
- `checkDueReminders` - HTTP callable function to check reminders
- `sendReminderNow` - HTTP callable function to send reminder immediately

### Step 5: Verify Deployment

After deploying, verify functions are live:

```bash
# List all deployed functions
firebase functions:list

# Check function logs
firebase functions:log
```

You should see all 11 email functions listed.

### Step 6: Test Email Functionality

Test each email trigger:

#### Test 1: Welcome Email (User Signup)
1. Sign up a new user in your app
2. Check Firestore `users` collection for the new user
3. Check the user's email inbox for welcome email
4. Check Firebase logs: `firebase functions:log --only onUserCreate`

#### Test 2: Project Submission Email
1. Submit a new project through your app
2. Check Firestore `project_submissions` collection
3. Check email inbox for confirmation
4. Check Firebase logs: `firebase functions:log --only onProjectSubmissionCreate`

#### Test 3: Event Submission Email
1. Submit a new event through your app
2. Check Firestore `event_submissions` collection
3. Check email inbox for confirmation
4. Check Firebase logs: `firebase functions:log --only onEventSubmissionCreate`

#### Test 4: Approval Email
1. As admin, approve a project in Firestore (set `status: 'approved'`)
2. Check email inbox for approval notification
3. Check Firebase logs: `firebase functions:log --only onProjectStatusChange`

#### Test 5: Edit Request Email
1. Submit an edit request for a project
2. Check Firestore `project_application_edit_requests` collection
3. Check email inbox for confirmation
4. Check Firebase logs: `firebase functions:log --only onProjectEditRequestCreate`

### Step 7: Monitor Resend Dashboard

1. Login to [resend.com](https://resend.com)
2. Navigate to **Emails** section
3. View sent emails and their delivery status
4. Check for any failed deliveries

## Troubleshooting

### Issue: "Resend not configured" in logs

**Solution**: Make sure environment variables are set:
```bash
firebase functions:config:get
```

If not set, run:
```bash
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="noreply@wasillah.live"
```

Then redeploy:
```bash
firebase deploy --only functions
```

### Issue: "Domain not verified" error

**Solution**: 
1. Go to [resend.com](https://resend.com) dashboard
2. Add `wasillah.live` domain
3. Add the DNS records provided by Resend to your domain registrar
4. Wait for verification (usually a few minutes)

### Issue: Emails not being sent

**Checklist**:
- [ ] Functions are deployed: `firebase functions:list`
- [ ] Environment variables are set: `firebase functions:config:get`
- [ ] Domain is verified in Resend dashboard
- [ ] API key is valid in Resend dashboard
- [ ] Firestore triggers are firing (check logs)
- [ ] No errors in Firebase Functions logs

### Issue: Function deployment requires Blaze plan

**Note**: Some functions (like scheduled functions) require the Blaze (pay-as-you-go) plan. However, the email functions triggered by Firestore events work on the Spark (free) plan.

If you're on Spark plan:
- ✅ All email functions will work (they're triggered by Firestore events)
- ❌ Scheduled reminder checking won't work automatically
- ✅ You can still call `sendReminderNow` manually via HTTPS

## Email Templates Included

All email templates are professionally designed with:
- Gradient header (brand colors)
- Responsive design
- Clear call-to-action buttons
- Wasillah branding
- Mobile-friendly layout

### Templates:
1. **Welcome Email** - Sent on user signup
2. **Submission Confirmation** - Sent when project/event submitted
3. **Approval Notification** - Sent when project/event approved
4. **Rejection Notification** - Sent when project/event rejected
5. **Edit Request Confirmation** - Sent when edit request created
6. **Edit Approved** - Sent when edit request approved
7. **Edit Rejected** - Sent when edit request rejected
8. **Reminder Email** - Sent for scheduled reminders

## Quick Commands Reference

```bash
# Login and select project
firebase login
firebase use wasilah-new

# Set environment variables
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="noreply@wasillah.live"

# Install dependencies
cd functions && npm install && cd ..

# Deploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list

# Check logs
firebase functions:log

# View specific function logs
firebase functions:log --only onUserCreate
firebase functions:log --only onProjectSubmissionCreate
```

## Success Criteria

Email functionality is live when:
- [x] Resend API key is configured
- [x] Code is ready (already implemented)
- [ ] Firebase Functions environment variables are set
- [ ] Functions are deployed to Firebase
- [ ] Domain is verified in Resend dashboard
- [ ] Test emails are being received
- [ ] No errors in Firebase Functions logs
- [ ] Emails appear in Resend dashboard

## Next Steps After Deployment

1. Monitor email delivery rates in Resend dashboard
2. Set up email alerts for failed deliveries
3. Review email templates and customize as needed
4. Configure rate limiting if needed
5. Set up email analytics tracking
6. Test all email flows in production

## Support Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend API Reference**: https://resend.com/docs/api-reference
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Firebase CLI**: https://firebase.google.com/docs/cli

---

**Last Updated**: November 13, 2025  
**Status**: Ready to deploy  
**Estimated Time**: 15-20 minutes
