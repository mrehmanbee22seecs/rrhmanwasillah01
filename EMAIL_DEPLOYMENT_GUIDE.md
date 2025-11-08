# Email System Deployment Guide

Quick deployment guide for the Wasillah Email Automation System.

## Prerequisites

- Firebase project (Spark or Blaze plan)
- MailerSend account (free tier available)
- (Optional) Upstash QStash account for scheduling

## Step-by-Step Deployment

### 1. Set Up MailerSend

1. Go to [https://www.mailersend.com](https://www.mailersend.com) and sign up
2. **FREE TRIAL DOMAIN** - MailerSend provides a trial domain for immediate testing:
   - No need to verify your own domain for testing
   - Look for your trial domain in the dashboard (e.g., `MS_qJLYQi@trial-0r83ql3jjz8lgwpz.mlsender.net`)
   - Use this trial domain to send test emails without owning a custom domain
3. (Optional) Verify your own domain for production:
   - Add your domain (e.g., `wasillah.org`)
   - Add DNS records as instructed
   - Wait for verification (usually instant)
4. Get your API key:
   - Go to API Keys section
   - Create a new API key
   - Copy the key

### 2. Update Email Sender

The code is pre-configured with a trial domain. For production, update `SENDER_EMAIL` in the following files:

```javascript
// src/services/mailerSendEmailService.ts
const SENDER_EMAIL = 'MS_qJLYQi@trial-0r83ql3jjz8lgwpz.mlsender.net'; // Replace with YOUR domain

// functions/emailFunctions.js
const SENDER_EMAIL = 'MS_qJLYQi@trial-0r83ql3jjz8lgwpz.mlsender.net'; // Replace with YOUR domain
```

**For Testing:** Use the trial domain as-is
**For Production:** Replace with `noreply@yourdomain.com` after verifying your domain

### 3. Configure Environment Variables

#### For Frontend (Client-side emails)

Create `.env.local` in project root:

```bash
VITE_MAILERSEND_API_KEY=re_your_key_here
VITE_QSTASH_TOKEN=qstash_your_token_here  # Optional
```

#### For Firebase Functions (Server-side emails)

Set environment variables for Firebase Functions:

```bash
# Using Firebase CLI
firebase functions:config:set mailersend.api_key="your_key_here"

# Or create functions/.env file (local development)
echo "MAILERSEND_API_KEY=your_key_here" > functions/.env
```

### 4. Deploy Firebase Functions (Optional - Requires Blaze Plan)

If you want automated server-side emails (submission confirmations, approvals, reminders):

```bash
# Check current Firebase plan
firebase projects:list

# Upgrade to Blaze plan if needed
firebase open billing

# Deploy functions
firebase deploy --only functions
```

**Note:** If you stay on Spark (free) plan, emails will be sent client-side, which works fine for welcome and volunteer confirmation emails.

### 5. Test the Email System

#### Test Welcome Email
```bash
# 1. Run app locally
npm run dev

# 2. Sign up with a new account
# 3. Check email for:
#    - Firebase verification email
#    - Welcome email from MailerSend
```

#### Test Volunteer Confirmation
```bash
# 1. Navigate to /volunteer
# 2. Fill out the form
# 3. Submit
# 4. Check email for confirmation
```

#### Test Reminder Creation
```bash
# 1. Navigate to /reminders
# 2. Fill out reminder form
# 3. Set future date/time
# 4. Check Firestore for reminder document
# 5. Wait for scheduled time (or use Firebase Functions to trigger)
```

#### Test Submission Emails (Requires Firebase Functions)
```bash
# 1. Deploy Firebase Functions first
# 2. Submit a project or event
# 3. Check email for confirmation
# 4. Approve in admin panel
# 5. Check email for approval notification
```

### 6. Set Up Upstash QStash (Optional)

For more precise reminder scheduling:

1. Sign up at [https://upstash.com](https://upstash.com)
2. Create a QStash project
3. Get your QStash token
4. Add to `.env.local`:
   ```bash
   VITE_QSTASH_TOKEN=qstash_your_token_here
   ```
5. Configure callback URL in QStash dashboard:
   - Development: `http://localhost:5173/api/sendReminder`
   - Production: `https://your-domain.com/api/sendReminder`

**Note:** For full QStash integration, you'll need a backend endpoint to handle callbacks.

### 7. Deploy to Production

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy functions (if on Blaze plan)
firebase deploy --only functions
```

### 8. Verify Deployment

After deployment:

1. **Check MailerSend Dashboard:**
   - View sent emails
   - Check delivery status
   - Monitor usage

2. **Check Firebase Functions Logs:**
   ```bash
   firebase functions:log
   ```

3. **Check Firestore:**
   - Verify reminder documents are created
   - Check volunteer_applications collection
   - Monitor submission documents

## Troubleshooting

### Emails Not Sending

**Problem:** Welcome email not arriving

**Solutions:**
1. Check MailerSend API key is correct in `.env.local`
2. Verify sender domain is verified in MailerSend
3. Check browser console for errors
4. Check MailerSend dashboard for failed emails

**Problem:** Submission emails not sending

**Solutions:**
1. Ensure Firebase Functions are deployed
2. Check Functions logs: `firebase functions:log`
3. Verify `MAILERSEND_API_KEY` is set in Functions config
4. Confirm Firestore triggers are working

### Reminders Not Sending

**Problem:** Scheduled reminders not arriving

**Solutions:**
1. Check reminder document exists in Firestore
2. Verify `sent` field is `false`
3. Ensure `scheduledAt` is in the future when created
4. Check Firebase Functions scheduled function is running
5. Verify Functions logs for errors

### Common Errors

**Error:** "MailerSend not configured"
```bash
# Solution: Add VITE_MAILERSEND_API_KEY to .env.local
echo "VITE_MAILERSEND_API_KEY=re_your_key_here" > .env.local
```

**Error:** "Domain not verified"
```bash
# Solution: Verify your domain in MailerSend dashboard
# Add DNS records and wait for verification
```

**Error:** "Functions deployment requires Blaze plan"
```bash
# Solution: Upgrade to Blaze plan or use client-side emails only
firebase open billing
```

## Cost Estimates

### Free Tier Limits

| Service | Free Tier | Notes |
|---------|-----------|-------|
| MailerSend | 100 emails/day | 3,000/month total |
| Upstash QStash | 500 messages/day | Optional |
| Firebase Spark | Limited functions | Good for testing |
| Firebase Blaze | Pay as you go | ~$0 for light usage |

### Expected Usage

For a small organization:
- **Welcome emails:** ~5-10/day = 150-300/month
- **Volunteer confirmations:** ~2-5/day = 60-150/month
- **Submission confirmations:** ~3-5/day = 90-150/month
- **Approval emails:** ~2-3/day = 60-90/month
- **Reminders:** ~5-10/day = 150-300/month

**Total:** ~510-990 emails/month (within free tier!)

## Next Steps

1. ✅ Deploy and test email system
2. ✅ Monitor MailerSend dashboard for delivery
3. ✅ Set up alerts for failed emails
4. Consider adding:
   - Email preferences for users
   - Email templates customization in admin panel
   - Batch email sending for announcements
   - Email analytics dashboard
   - SMS notifications as backup

## Support

If you encounter issues:

1. Check [EMAIL_SYSTEM_README.md](./EMAIL_SYSTEM_README.md) for detailed documentation
2. Review Firebase Functions logs
3. Check MailerSend dashboard for email status
4. Verify Firestore data structure matches schema
5. Test locally before deploying to production

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use `.gitignore` for environment files
- [ ] Verify sender domain to prevent spoofing
- [ ] Implement rate limiting for reminder creation
- [ ] Use Firestore security rules
- [ ] Validate all user inputs
- [ ] Monitor for abuse (excessive emails)
- [ ] Set up alerts for unusual activity

## Success Metrics

Track these metrics to measure success:

- Email delivery rate (should be >95%)
- Open rate (typical: 20-30%)
- Bounce rate (should be <5%)
- User satisfaction with reminders
- Reduction in missed deadlines
- Volunteer response time improvement

---

**Ready to launch!** 🚀

Your email automation system is now fully configured and ready to serve your community.
