# Quick Start: Email System on Spark Plan

## 🚀 3-Step Setup (5 minutes)

### Step 1: Get Resend API Key
1. Go to [resend.com](https://resend.com/) and sign up
2. Click "API Keys" → "Create API Key"
3. Copy the key (starts with `re_`)

### Step 2: Configure Environment
Create `.env` file in project root:
```env
VITE_RESEND_API_KEY=re_YOUR_API_KEY_HERE
VITE_RESEND_SENDER_EMAIL=noreply@wasillah.live
```

For testing, use:
```env
VITE_RESEND_SENDER_EMAIL=onboarding@resend.dev
```

### Step 3: Deploy
```bash
npm install
npm run build
firebase deploy --only hosting
```

**That's it!** ✅ Email system is live on FREE Spark plan.

## ✅ What Works

- ✉️ Welcome emails when users sign up
- 📧 Submission confirmation emails
- ✅ Approval/rejection notification emails
- 📝 Edit request confirmation and status emails
- ⏰ Reminder emails (checks every 5 min when dashboard is open)

## 🔒 Security (Optional but Recommended)

Add domain restrictions in Resend:
1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Click your API key
3. Add domains:
   - `wasillah.live`
   - `*.wasillah.live`
   - `localhost` (for dev)

## 📊 Usage Limits

| Service | Free Tier | Usage |
|---------|-----------|-------|
| Firebase Spark | 50K reads/day, 20K writes/day | ~500 reads/day |
| Resend | 100 emails/day | ~20-30 emails/day |

**Perfect for**: Small to medium apps, development, MVPs

## 🧪 Test Email Functionality

### 1. Test Welcome Email
1. Sign up as new user
2. Check email inbox
3. Should receive role-specific welcome email

### 2. Test Submission Email
1. Login as user
2. Create a project/event submission
3. Check email for confirmation

### 3. Test Approval Email
1. Login as admin
2. Approve a submission
3. Submitter should receive approval email

### 4. Test Reminder Email
1. Create a reminder with past date
2. Open dashboard
3. Click "Check for Due Reminders"
4. Should receive reminder email

## ⚠️ Common Issues

### Emails not sending?
- ✅ Check `.env` file has correct API key
- ✅ Check browser console for errors
- ✅ Verify sender email in Resend dashboard
- ✅ Check [resend.com/logs](https://resend.com/logs) for failures

### Reminders not sending?
- ✅ Open dashboard (auto-checks every 5 minutes)
- ✅ Click "Check for Due Reminders" button
- ✅ Verify reminder date is in the past
- ✅ Check console for errors

### API key errors?
- ✅ Make sure key starts with `re_`
- ✅ Check `.env` file name (not `.env.example`)
- ✅ Restart dev server after changing `.env`
- ✅ Rebuild for production: `npm run build`

## 💰 Cost Breakdown

| Component | Cost |
|-----------|------|
| Firebase Spark Plan | **$0/month** |
| Resend Free Tier | **$0/month** |
| **Total** | **$0/month** 🎉 |

## 📚 Full Documentation

- [EMAIL_SPARK_PLAN_GUIDE.md](./EMAIL_SPARK_PLAN_GUIDE.md) - Complete guide
- [FIREBASE_SPARK_COMPATIBILITY.md](./FIREBASE_SPARK_COMPATIBILITY.md) - Technical details
- [EMAIL_SYSTEM_README.md](./EMAIL_SYSTEM_README.md) - Email templates

## 🆘 Need Help?

1. Check browser console for errors
2. Check [resend.com/logs](https://resend.com/logs)
3. Review [EMAIL_SPARK_PLAN_GUIDE.md](./EMAIL_SPARK_PLAN_GUIDE.md) troubleshooting section
4. Check `.env` configuration

---

**Status**: ✅ Production Ready  
**Plan**: Firebase Spark (FREE)  
**Email Provider**: Resend (FREE tier)  
**Setup Time**: ~5 minutes
