# ⚡ QUICK TROUBLESHOOTING CHECKLIST

## 🔍 Is Your Email System Working?

Use this checklist to quickly diagnose and fix issues.

---

## ✅ Step 1: Verify Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Check these are set:**

| Variable | Required | Where to Get It |
|----------|----------|-----------------|
| `MAILERSEND_API_KEY` | ✅ YES | MailerSend Dashboard → API Tokens |
| `VITE_QSTASH_TOKEN` | ✅ YES (for reminders) | Upstash Dashboard → QStash |
| `FIREBASE_PROJECT_ID` | ✅ YES | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | ✅ YES | Firebase Console → Service Account JSON |
| `FIREBASE_PRIVATE_KEY` | ✅ YES | Firebase Console → Service Account JSON |
| `MAILERSEND_SENDER_EMAIL` | ⚪ Optional | Defaults to trial domain |

**After adding/changing variables:** Redeploy your app!

---

## ✅ Step 2: Test Each Feature

### Test 1: Welcome Email (Simplest)

**How to test:**
1. Go to your deployed site
2. Sign up with a new email
3. Check your inbox

**Expected result:** Welcome email from Wasillah Team

**If not working:**
- [ ] Check `MAILERSEND_API_KEY` is set in Vercel
- [ ] Check MailerSend dashboard for logs
- [ ] Open browser console (F12) - any errors?
- [ ] Redeploy after setting variables

---

### Test 2: Volunteer Form

**How to test:**
1. Go to `/volunteer` page
2. Fill out the form
3. Submit
4. Check your inbox

**Expected result:** Thank you email from Wasillah Team

**If not working:**
- Same checks as Test 1

---

### Test 3: Reminders (Most Complex)

**How to test:**
1. Go to `/reminders` page
2. Create a reminder for **2 minutes from now**
3. Wait 2 minutes
4. Check your inbox

**Expected result:** Reminder email at scheduled time

**If not working, check in order:**

**A. QStash Token**
- [ ] Is `VITE_QSTASH_TOKEN` set in Vercel?
- [ ] Is it the correct token from Upstash?
- [ ] Did you redeploy after setting it?

**B. Vercel Function**
- [ ] Go to Vercel Dashboard → Your Project → Functions
- [ ] Look for `send-reminder` function
- [ ] Check if it exists and is deployed
- [ ] Click on it to see logs

**C. Firebase Connection**
- [ ] Is `FIREBASE_PROJECT_ID` correct?
- [ ] Is `FIREBASE_CLIENT_EMAIL` correct?
- [ ] Is `FIREBASE_PRIVATE_KEY` complete (including BEGIN/END lines)?

**D. Check QStash Dashboard**
- [ ] Go to Upstash Console → QStash
- [ ] Look for scheduled messages
- [ ] Check if your message is there
- [ ] Check delivery status

---

## 🐛 Common Errors & Solutions

### Error: "MailerSend not configured"

**Problem:** MailerSend API key not found

**Solution:**
1. Add `MAILERSEND_API_KEY` to Vercel environment variables
2. Make sure there are no spaces before/after the key
3. Redeploy the app

---

### Error: "QStash not configured"

**Problem:** QStash token not found

**Solution:**
1. Add `VITE_QSTASH_TOKEN` to Vercel environment variables
2. Make sure it's the correct token from Upstash
3. Redeploy the app

---

### Error: "Reminder not found"

**Problem:** Firestore connection issue

**Solution:**
1. Check all three Firebase variables are set correctly
2. Verify `FIREBASE_PRIVATE_KEY` includes `\n` characters
3. Make sure you copied the entire private key
4. Check Firebase Console - is the project ID correct?

---

### Error: "Failed to send email"

**Problem:** MailerSend API issue

**Solution:**
1. Check MailerSend dashboard for error logs
2. Verify API key is valid (not expired)
3. Check if you've hit the free tier limit (3,000 emails/month)
4. Try generating a new API key

---

### Error: "Function timeout"

**Problem:** Vercel function took too long

**Solution:**
1. Check `vercel.json` exists in your project root
2. Increase `maxDuration` if needed
3. Check Firestore rules allow the operation

---

## 📊 How to Check Logs

### Vercel Function Logs
1. Go to Vercel Dashboard
2. Click your project
3. Click "Functions" tab
4. Click `send-reminder` function
5. See all executions and errors

### MailerSend Logs
1. Go to MailerSend Dashboard
2. Click "Activity" or "Logs"
3. See all sent emails and their status

### QStash Dashboard
1. Go to Upstash Console
2. Go to QStash section
3. See all scheduled messages
4. Check delivery status

### Browser Console
1. Open your site
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to Console tab
4. Look for error messages in red

---

## 🎯 Quick Fixes

### "I just added environment variables but it's still not working"

**Solution:** **REDEPLOY** your app after adding environment variables!
1. Go to Vercel Dashboard
2. Go to your project
3. Click "Deployments"
4. Click "Redeploy" on the latest deployment

---

### "The reminder was created but email never came"

**Check:**
1. Did you wait until the scheduled time?
2. Check QStash dashboard - was it delivered to your function?
3. Check Vercel function logs - did it execute?
4. Check MailerSend logs - was the email sent?

**Most common cause:** Forgot to redeploy after setting `VITE_QSTASH_TOKEN`

---

### "I'm getting CORS errors"

**This shouldn't happen, but if it does:**
1. Make sure you're using the deployed Vercel URL, not localhost
2. Check if QStash is calling the right URL
3. Verify `vercel.json` is in your project root

---

## 📋 Complete Verification Checklist

Run through this before asking for help:

### Environment Variables
- [ ] `MAILERSEND_API_KEY` set in Vercel
- [ ] `VITE_QSTASH_TOKEN` set in Vercel
- [ ] `FIREBASE_PROJECT_ID` set in Vercel
- [ ] `FIREBASE_CLIENT_EMAIL` set in Vercel
- [ ] `FIREBASE_PRIVATE_KEY` set in Vercel (complete, with \n)
- [ ] Redeployed after setting variables

### Files Exist
- [ ] `api/send-reminder.js` exists in your repo
- [ ] `api/package.json` exists in your repo
- [ ] `vercel.json` exists in your repo root

### Services Active
- [ ] MailerSend account active
- [ ] Upstash QStash account active
- [ ] Firebase project active
- [ ] Vercel project deployed

### Feature Tests
- [ ] Welcome email works (sign up test)
- [ ] Volunteer form email works
- [ ] Reminder gets created (check Firestore)
- [ ] Reminder email arrives at scheduled time

---

## 🆘 Still Stuck?

If you've checked everything above and it's still not working:

1. **Check Vercel deployment logs:**
   - Look for build errors
   - Check if API function deployed

2. **Share these logs:**
   - Vercel function logs (from Vercel Dashboard)
   - Browser console errors (screenshot)
   - MailerSend activity log (screenshot)

3. **Verify API endpoint:**
   - Open `https://your-site.vercel.app/api/send-reminder` in browser
   - You should see "Method not allowed" (that's correct!)
   - If you see 404, the function didn't deploy

---

## ✨ Pro Tips

1. **Start simple:** Get welcome emails working first, then move to reminders
2. **Check dashboards:** MailerSend and QStash dashboards show everything
3. **Use test emails:** Set reminders 1-2 minutes in future for quick testing
4. **Redeploy often:** After any environment variable change
5. **Copy-paste carefully:** API keys are long and easy to mistype

---

## 📞 Getting Help

When asking for help, provide:
- Which test is failing (1, 2, or 3)
- Screenshot of browser console errors
- Screenshot of Vercel function logs
- Confirmation that environment variables are set

**Remember:** Most issues are fixed by simply redeploying after setting environment variables! 🚀
