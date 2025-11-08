# Vercel Domain Authorization for Firebase OAuth

## 🚨 Critical: Domain Authorization Required

Your Vercel deployment domain `rrhmanwasillah01-bay.vercel.app` must be authorized in Firebase Console for OAuth to work.

## ✅ Step-by-Step Fix

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Sign in with your Google account
3. Select project: **wasilah-new**

### Step 2: Navigate to Authorized Domains
1. Click on: **Authentication** (left sidebar)
2. Click on: **Settings** tab (top navigation)
3. Scroll down to: **Authorized domains** section
4. You should see a list of domains like:
   - `localhost`
   - `wasilah-new.firebaseapp.com`
   - `wasilah-new.web.app`

### Step 3: Add Vercel Domain
1. Click: **Add domain** button
2. Enter: `rrhmanwasillah01-bay.vercel.app`
3. Click: **Add**
4. Wait: **1-2 minutes** for changes to propagate

### Step 4: Verify Domain is Added
The domain should now appear in the authorized domains list.

### Step 5: Test OAuth
1. Clear browser cache and storage
2. Go to your Vercel deployment
3. Click "Continue with Google"
4. Check console for OAuth parameters in URL
5. Verify authentication works

## 🔍 Multiple Vercel Deployments

If you have multiple Vercel preview deployments, you have two options:

### Option 1: Authorize Each Preview URL (Not Recommended)
- Each preview URL needs to be authorized separately
- Preview URLs change with each deployment
- Not practical for development

### Option 2: Use Custom Domain (Recommended)
1. **Set up custom domain in Vercel**:
   - Go to Vercel dashboard
   - Select your project
   - Go to Settings > Domains
   - Add your custom domain (e.g., `wasilah.org`)

2. **Authorize custom domain in Firebase**:
   - Go to Firebase Console > Authentication > Settings > Authorized domains
   - Add your custom domain (e.g., `wasilah.org`)
   - Add `www.wasilah.org` if you use www subdomain

3. **Benefits**:
   - One domain to authorize
   - Stable URL for OAuth
   - Professional appearance
   - Works with all deployments

## 🎯 Quick Checklist

- [ ] Firebase Console open
- [ ] Project `wasilah-new` selected
- [ ] Authentication > Settings > Authorized domains
- [ ] Domain `rrhmanwasillah01-bay.vercel.app` added
- [ ] Waited 1-2 minutes
- [ ] Cleared browser cache
- [ ] Tested OAuth login
- [ ] Verified OAuth parameters in URL
- [ ] Confirmed authentication works

## 🚨 Common Issues

### Issue 1: Domain Not Showing Up
**Solution**: Wait 1-2 minutes and refresh the page. Firebase changes take time to propagate.

### Issue 2: Still Not Working After Authorization
**Solution**: 
1. Clear browser cache completely
2. Try in incognito/private window
3. Check browser console for errors
4. Verify domain spelling is correct

### Issue 3: Multiple Preview URLs
**Solution**: Use a custom domain instead of preview URLs. Preview URLs change with each deployment.

## 📋 Verification

After authorizing the domain, you should see in console:

```
🔍 [OAuth Debug] OAuth parameters detected in URL
✅ [OAuth Debug] Redirect result received
✅ User authenticated via redirect: user@example.com
```

If you still see:
```
ℹ️ [OAuth Debug] No redirect result (normal page load)
```

Then:
1. Double-check domain is authorized
2. Wait longer (up to 5 minutes)
3. Clear browser cache
4. Try different browser
5. Check Firebase Console for any errors

## 🎯 Expected Result

After fixing:
1. Click "Continue with Google"
2. Redirects to Google OAuth page
3. User authenticates
4. Redirects back with OAuth parameters in URL
5. User is authenticated
6. Navigates to dashboard

---

**Most Important**: Authorize `rrhmanwasillah01-bay.vercel.app` in Firebase Console!

