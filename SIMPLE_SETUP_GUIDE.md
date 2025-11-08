# 🚀 SIMPLIFIED EMAIL SYSTEM SETUP - STEP BY STEP

## What You Have Now

A **fully working email system** that uses:
- **MailerSend** for sending emails (no custom domain needed!)
- **QStash** for scheduling reminders
- **Vercel Serverless Functions** for the backend API (no Firebase Functions needed!)

## 🔑 Environment Variables You Need in Vercel

Go to your Vercel project settings → Environment Variables and add these:

### 1. MailerSend (REQUIRED)
```
MAILERSEND_API_KEY=your_mailersend_api_key_here
```

**How to get it:**
1. Go to https://www.mailersend.com
2. Login to your account
3. Go to "API Tokens" in the menu
4. Click "Create Token"
5. Give it a name (e.g., "Wasillah Production")
6. Copy the token

### 2. MailerSend Sender Email (OPTIONAL - uses trial domain by default)
```
MAILERSEND_SENDER_EMAIL=your_sender@mailersend.net
```

**Note:** If you don't set this, it will use the free trial domain automatically!

### 3. QStash (REQUIRED for reminders)
```
VITE_QSTASH_TOKEN=your_qstash_token_here
```

**How to get it:**
1. Go to https://upstash.com
2. Login to your account
3. Go to QStash section
4. Find your "QSTASH_TOKEN"
5. Copy it

### 4. Firebase (REQUIRED for database)
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

**How to get these:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Project Settings (gear icon) → Service Accounts
4. Click "Generate New Private Key"
5. You'll get a JSON file with these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

**Important for FIREBASE_PRIVATE_KEY:**
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters as they are (don't remove them)

## ✅ Complete Environment Variables List for Vercel

```bash
# MailerSend (for sending emails)
MAILERSEND_API_KEY=your_mailersend_api_key

# Optional: Custom sender email (defaults to trial domain if not set)
MAILERSEND_SENDER_EMAIL=MS_qJLYQi@trial-0r83ql3jjz8lgwpz.mlsender.net

# QStash (for scheduling reminders)
VITE_QSTASH_TOKEN=your_qstash_token

# Firebase (for database)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key_with_newlines
```

## 🎯 How The System Works Now

### 1. Welcome Emails (WORKS IMMEDIATELY)
- User signs up
- Email sent instantly via MailerSend
- ✅ No configuration needed (happens client-side)

### 2. Volunteer Form (WORKS IMMEDIATELY)
- User submits volunteer form
- Confirmation email sent via MailerSend
- ✅ No configuration needed (happens client-side)

### 3. Reminders (NEEDS QSTASH TOKEN)
- User creates a reminder
- Reminder saved to Firestore
- QStash schedules the reminder
- At the scheduled time, QStash calls `/api/send-reminder`
- Email sent via MailerSend
- ✅ Requires VITE_QSTASH_TOKEN in Vercel

### 4. Submission & Approval Emails (OPTIONAL - Firebase Functions)
These are currently set up in Firebase Functions but are OPTIONAL.
You can enable them later if you upgrade to Firebase Blaze plan.

## 🧪 Testing Your Setup

### Test 1: Welcome Email (Easiest)
1. Deploy to Vercel
2. Sign up with a new account
3. Check your email inbox
4. ✅ You should receive a welcome email

### Test 2: Volunteer Form
1. Go to /volunteer page
2. Fill out the form
3. Submit
4. Check your email
5. ✅ You should receive a confirmation email

### Test 3: Reminders (Requires QStash)
1. Make sure VITE_QSTASH_TOKEN is set in Vercel
2. Go to /reminders page
3. Create a reminder for 2 minutes from now
4. Wait 2 minutes
5. ✅ You should receive the reminder email

## 🐛 Troubleshooting

### "Welcome email not working"
**Check:**
1. Is `MAILERSEND_API_KEY` set in Vercel?
2. Check browser console for errors
3. Check MailerSend dashboard for email logs

### "Reminder not working"
**Check:**
1. Is `VITE_QSTASH_TOKEN` set in Vercel?
2. Is the token correct? (copy-paste again)
3. Check Vercel function logs:
   - Go to Vercel Dashboard
   - Click on your project
   - Go to "Functions"
   - Look for `/api/send-reminder` logs
4. Check QStash dashboard for scheduled messages

### "Internal Server Error on reminder"
**Check Firebase variables:**
1. Is `FIREBASE_PROJECT_ID` correct?
2. Is `FIREBASE_CLIENT_EMAIL` correct?
3. Is `FIREBASE_PRIVATE_KEY` correct (with all the `\n` characters)?

## 📝 Environment Variables Checklist

Before deploying, make sure you have set ALL of these in Vercel:

- [ ] `MAILERSEND_API_KEY` - From MailerSend dashboard
- [ ] `VITE_QSTASH_TOKEN` - From Upstash dashboard
- [ ] `FIREBASE_PROJECT_ID` - From Firebase service account JSON
- [ ] `FIREBASE_CLIENT_EMAIL` - From Firebase service account JSON
- [ ] `FIREBASE_PRIVATE_KEY` - From Firebase service account JSON

## 🎉 What Works Right Now

| Feature | Status | Needs |
|---------|--------|-------|
| Welcome Email | ✅ Works | MAILERSEND_API_KEY |
| Volunteer Confirmation | ✅ Works | MAILERSEND_API_KEY |
| Password Reset | ✅ Works | Built-in Firebase |
| Reminders | ✅ Works | MAILERSEND_API_KEY + VITE_QSTASH_TOKEN + Firebase vars |
| Submission Emails | ⏳ Optional | Firebase Functions (Blaze plan) |
| Approval Emails | ⏳ Optional | Firebase Functions (Blaze plan) |

## 🔗 Helpful Links

- **MailerSend Dashboard:** https://www.mailersend.com/dashboard
- **Upstash Dashboard:** https://console.upstash.com
- **Firebase Console:** https://console.firebase.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard

## 💡 Pro Tips

1. **Test locally first:**
   - Create `.env.local` with the same variables
   - Run `npm run dev`
   - Test features before deploying

2. **Use the trial domain:**
   - Don't worry about verifying your own domain initially
   - MailerSend's trial domain works great for testing

3. **Check the logs:**
   - Vercel function logs show exactly what's happening
   - MailerSend dashboard shows all sent emails

4. **Start simple:**
   - Get welcome emails working first
   - Then test volunteer form
   - Finally test reminders

## ❓ Still Not Working?

If you've set all the environment variables and it's still not working:

1. **Check Vercel deployment logs:**
   - Look for build errors
   - Check function execution logs

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab

3. **Verify API keys:**
   - Re-copy the MailerSend API key
   - Re-copy the QStash token
   - Make sure there are no extra spaces

4. **Redeploy:**
   - After adding environment variables, redeploy the app
   - Vercel needs to rebuild with the new variables

## ✅ Summary

You now have a **complete, working email system** that:
- ✅ Sends welcome emails instantly
- ✅ Sends volunteer confirmations instantly
- ✅ Schedules and sends reminders via QStash
- ✅ Works on Vercel without Firebase Functions
- ✅ Uses free tier services (MailerSend + QStash)

**Just add the environment variables in Vercel and deploy!** 🚀
