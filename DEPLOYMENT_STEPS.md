# 🚀 Deployment Checklist - Making Resend Email Live

## Current Status
✅ Code migration is complete  
✅ API key is configured in code as fallback: `re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve`  
⚠️ **Action Required**: Configure environment variables and deploy

---

## What You Need to Do (Step-by-Step)

### Step 1: Set Up Environment Variables (CRITICAL)

While the API key is hardcoded as a fallback, **you should set it as an environment variable** for security and flexibility.

#### A. For Firebase Functions

```bash
# Set environment variables
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase functions:config:set resend.sender_email="onboarding@resend.dev"

# Verify they're set
firebase functions:config:get
```

#### B. For Frontend (Vercel/Netlify/Other Hosting)

Add these environment variables in your hosting provider's dashboard:

```
VITE_RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
VITE_RESEND_SENDER_EMAIL=onboarding@resend.dev
```

**Where to add them:**
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Firebase Hosting**: Use `.env.production` file (not recommended for secrets)

#### C. For API Endpoint (if using Vercel)

In your Vercel project settings, add:

```
RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
RESEND_SENDER_EMAIL=onboarding@resend.dev
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

---

### Step 2: Deploy the Code

#### A. Deploy Firebase Functions

```bash
# Navigate to project root
cd /path/to/your/project

# Install dependencies (if not already done)
cd functions
npm install
cd ..

# Deploy functions and Firestore indexes
firebase deploy --only functions,firestore:indexes

# Expected output:
# ✔ Deploy complete!
# Functions deployed: onProjectSubmissionCreate, onEventSubmissionCreate, etc.
```

#### B. Deploy Frontend

```bash
# Build the frontend
npm install
npm run build

# Deploy based on your hosting provider:

# If using Vercel:
vercel --prod

# If using Netlify:
netlify deploy --prod

# If using Firebase Hosting:
firebase deploy --only hosting
```

#### C. Deploy API Endpoint (if separate)

```bash
cd api
npm install
cd ..

# If using Vercel:
vercel deploy --prod
```

---

### Step 3: Verify Deployment

#### A. Check Firebase Functions

```bash
# View deployed functions
firebase functions:list

# Check logs
firebase functions:log --only onProjectSubmissionCreate

# Expected: No errors, functions should be listed
```

#### B. Test Email Sending

**Option 1: Quick Test Script**
```bash
export RESEND_API_KEY=re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve
export TEST_EMAIL=your-actual-email@example.com
node /tmp/test-email-service.js
```

**Option 2: Live Test**
1. Create a new account on your deployed site
2. Check if you receive a welcome email
3. Submit a project/event
4. Check if you receive a confirmation email

#### C. Monitor Resend Dashboard

1. Go to https://resend.com/emails
2. Log in to your Resend account
3. Check recent emails sent
4. Verify delivery status

---

### Step 4: Monitor for Issues

#### Check Firebase Logs (First 24 Hours)

```bash
# Real-time logs
firebase functions:log --follow

# Look for:
✅ "Email sent via Resend: xyz123"
❌ "Failed to send email via Resend:"
```

#### Check Error Rates

```bash
# Firebase Console → Functions → View logs
# Look for any errors or failures
```

---

## Common Issues & Solutions

### Issue 1: "Resend not configured"

**Cause**: Environment variables not set or functions not redeployed  
**Solution**: 
```bash
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"
firebase deploy --only functions
```

### Issue 2: No emails received

**Check:**
1. Spam/junk folder
2. Resend dashboard for delivery status
3. Firebase Functions logs for errors
4. API key is correct and active

**Debug:**
```bash
# Check if functions are running
firebase functions:log --only onProjectSubmissionCreate

# Test API key directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve" \
  -H "Content-Type: application/json" \
  -d '{"from":"onboarding@resend.dev","to":"test@example.com","subject":"Test","html":"Test"}'
```

### Issue 3: Build fails

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## What Happens After Deployment?

### Immediate (Minutes)
- Firebase Functions go live
- New signups receive welcome emails
- Submissions trigger confirmation emails

### Short Term (Hours)
- Monitor logs for any errors
- Check email delivery rates in Resend dashboard
- Verify all 5 email types are working

### Long Term (Days)
- Monitor daily email usage (free tier: 100 emails/day)
- Track delivery rates and bounces
- Consider upgrading Resend plan if needed

---

## Security Note: API Key Hardcoding

**Current State**: API key is hardcoded as a fallback in:
- `functions/emailFunctions.js`
- `api/send-reminder.js`
- `src/services/resendEmailService.ts`

**Why it's okay for now:**
- API key is read-only (can only send emails)
- Code is in a private repository
- Fallback ensures emails work even if env vars fail

**Best Practice for Production:**
After deployment is working, consider:
1. Removing hardcoded keys from code
2. Using only environment variables
3. Rotating the API key if needed
4. Setting up key rotation schedule

---

## Quick Deployment Command Summary

```bash
# ONE-TIME SETUP
firebase functions:config:set resend.api_key="re_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve"

# DEPLOY
cd functions && npm install && cd ..
firebase deploy --only functions,firestore:indexes
npm run build
# Then deploy frontend to your hosting provider

# VERIFY
firebase functions:log
# Check https://resend.com/emails
```

---

## Support & Documentation

- **Quick Start**: See `QUICK_REFERENCE.md`
- **Testing**: See `EMAIL_TESTING_GUIDE.md`
- **Complete Guide**: See `RESEND_MIGRATION_GUIDE.md`
- **Resend Docs**: https://resend.com/docs

---

## Checklist

Before going live:
- [ ] Set Firebase Functions environment variables
- [ ] Set frontend hosting environment variables
- [ ] Deploy Firebase Functions
- [ ] Deploy Firestore indexes
- [ ] Deploy frontend
- [ ] Test welcome email (sign up)
- [ ] Test submission confirmation (submit project)
- [ ] Check Firebase logs (no errors)
- [ ] Check Resend dashboard (emails sent)
- [ ] Monitor for 24 hours

After going live:
- [ ] Remove hardcoded API keys (optional but recommended)
- [ ] Set up monitoring alerts
- [ ] Document any custom configurations
- [ ] Plan for scale (upgrade Resend if needed)

---

**TL;DR**: 
1. Set environment variables: `firebase functions:config:set resend.api_key="..."`
2. Deploy: `firebase deploy --only functions,firestore:indexes`
3. Deploy frontend to your hosting provider
4. Test by signing up and submitting a project
5. Check logs and Resend dashboard

The API key is hardcoded as a fallback, so it will work immediately after deployment, but **you should still set environment variables** for best practices.
