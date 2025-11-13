# Email Service Testing Guide

## Overview
This guide helps you test the Resend email integration in the Wasillah platform.

## Prerequisites

1. **Resend API Key**: `re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve`
2. **Test Email Address**: Your email to receive test messages
3. **Firebase Project**: Access to Firebase console
4. **Node.js**: Installed and configured

## Quick Test

### 1. Test Email Service Directly

Run the test script to verify basic email functionality:

```bash
cd /home/runner/work/rrhmanwasillah01/rrhmanwasillah01
export RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
export TEST_EMAIL=your-email@example.com
node /tmp/test-email-service.js
```

Expected output:
```
============================================================
Resend Email Service Test Suite
============================================================

Testing Welcome Email...
✅ Welcome email sent successfully!
   Email ID: xyz123

Testing Submission Confirmation Email...
✅ Submission confirmation email sent successfully!
   Email ID: abc456

...

Overall: 5/5 tests passed
🎉 All tests passed! Resend integration is working correctly.
```

### 2. Check Your Inbox

After running the test, check your email inbox for 5 test emails:
1. Welcome Email
2. Submission Confirmation
3. Approval Email
4. Reminder Email
5. Volunteer Confirmation

## Integration Testing

### Test 1: Welcome Email on Signup

1. Navigate to the signup page
2. Create a new account with your email
3. Complete the signup process
4. Check your inbox for a welcome email

**Expected**: Role-specific welcome email with personalized content

### Test 2: Project Submission Confirmation

1. Log in as a user (student/NGO)
2. Navigate to "Create Submission" page
3. Submit a new project
4. Check your inbox for confirmation email

**Expected**: Email confirming project submission received

### Test 3: Event Submission Confirmation

1. Log in as a user
2. Navigate to "Create Submission" page
3. Submit a new event
4. Check your inbox for confirmation email

**Expected**: Email confirming event submission received

### Test 4: Approval Notification

1. Log in as an admin
2. Navigate to Dashboard > Admin Panel
3. Approve a pending project or event
4. Check the submitter's inbox for approval email

**Expected**: Email with celebration emoji and approval message

### Test 5: Reminder Email

#### Via Firebase Function (Scheduled)
1. Create a reminder in the system
2. Set a future date/time
3. Wait for the scheduled time
4. Check inbox for reminder email

#### Via API (Immediate)
```bash
curl -X POST https://your-api-endpoint/api/send-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "reminderId": "test123",
    "email": "your-email@example.com",
    "name": "Test User",
    "projectName": "Test Project",
    "message": "This is a test reminder"
  }'
```

**Expected**: Email with reminder message in yellow alert box

### Test 6: Volunteer Confirmation

1. Navigate to the Volunteer page
2. Fill out the volunteer form
3. Submit the form
4. Check your inbox for confirmation email

**Expected**: Email thanking for volunteering with next steps

## Firebase Functions Testing

### Deploy Functions (if not deployed)

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Test Functions in Firebase Console

1. Go to Firebase Console → Functions
2. Find the functions:
   - `onProjectSubmissionCreate`
   - `onEventSubmissionCreate`
   - `onProjectStatusChange`
   - `onEventStatusChange`
   - `sendDueReminders`
3. Check logs for any errors

### Monitor Function Execution

```bash
firebase functions:log
```

Look for:
- "Email sent via Resend: xyz123" (success)
- "Failed to send email via Resend:" (errors)

## Troubleshooting

### Issue: No emails received

**Check:**
1. Spam/Junk folder
2. Resend dashboard for delivery status
3. Firebase Functions logs for errors
4. API key is correctly set in environment variables

**Solution:**
```bash
# Verify API key
echo $RESEND_API_KEY

# Check Firebase config
firebase functions:config:get

# View logs
firebase functions:log --only onProjectSubmissionCreate
```

### Issue: Emails sent but not delivered

**Check Resend Dashboard:**
1. Go to https://resend.com/emails
2. Check email status
3. Look for bounce/failure reasons

**Common causes:**
- Invalid recipient email
- Rate limits exceeded
- Domain not verified (if using custom domain)

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Rebuild the project
npm install
npm run build
```

### Issue: Firebase Functions timeout

**Check:**
1. Function execution time in logs
2. Network connectivity
3. Resend API response time

**Solution:**
- Increase function timeout in firebase.json
- Add retry logic for failed emails

## Environment Variables Checklist

### Frontend (.env)
```bash
✓ VITE_RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
✓ VITE_RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### Firebase Functions
```bash
✓ RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
✓ RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### API Endpoint (Vercel/Netlify)
```bash
✓ RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
✓ RESEND_SENDER_EMAIL=onboarding@resend.dev
✓ FIREBASE_PROJECT_ID=your-project-id
✓ FIREBASE_CLIENT_EMAIL=your-client-email
✓ FIREBASE_PRIVATE_KEY=your-private-key
```

## Performance Testing

### Test Email Sending Speed

```bash
time node /tmp/test-email-service.js
```

Expected: < 10 seconds for 5 emails

### Test Concurrent Requests

Create multiple submissions simultaneously and verify all emails are sent.

### Monitor Rate Limits

Resend free tier limits:
- 100 emails/day (free plan)
- 3,000 emails/month (free plan)

Monitor usage at: https://resend.com/dashboard

## Security Verification

### Verify API Key Security

1. ✓ API key not committed to git
2. ✓ API key stored in environment variables
3. ✓ API key not exposed in client-side code
4. ✓ API key rotated regularly

### Check Email Content

1. ✓ No sensitive data in email subject
2. ✓ Personal data properly formatted
3. ✓ Links are HTTPS
4. ✓ Unsubscribe mechanism (if needed)

## Success Criteria

All tests should pass with:
- ✅ Emails delivered within 30 seconds
- ✅ All 5 email types working
- ✅ No errors in Firebase logs
- ✅ No errors in Resend dashboard
- ✅ Correct sender name and email
- ✅ Professional email formatting
- ✅ All links working correctly

## Next Steps After Testing

1. ✅ Verify all email types are working
2. ✅ Check Firestore rules and indexes
3. ✅ Update production environment variables
4. ✅ Deploy to production
5. ✅ Monitor first 24 hours of production emails
6. ✅ Set up alerts for email failures

## Support Resources

- **Resend Docs**: https://resend.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Project Issues**: https://github.com/mrehmanbee22seecs/rrhmanwasillah01/issues

## Testing Checklist

- [ ] Run test script successfully
- [ ] Receive all 5 test emails
- [ ] Test welcome email on signup
- [ ] Test project submission confirmation
- [ ] Test event submission confirmation
- [ ] Test approval notification
- [ ] Test reminder email
- [ ] Test volunteer confirmation
- [ ] Check Firebase Functions logs
- [ ] Check Resend dashboard
- [ ] Verify no errors in production
- [ ] Document any issues found

---

Last updated: November 10, 2025
Migration completed: ✅ Ready for production
