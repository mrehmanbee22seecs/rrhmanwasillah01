# OAuth Login Fix - Quick Testing Guide

## 🚀 Quick Test Steps

### Test 1: New User Google Login (Primary Test)
**Time**: ~2 minutes

1. Open browser in **Incognito/Private mode** (or clear browser data)
2. Navigate to your application URL
3. Click **"Get Started"** button
4. Click **"Continue with Google"**
5. Complete Google authentication
6. **Expected**: 
   - ✅ Automatically redirected to `/dashboard`
   - ✅ No onboarding modal appears
   - ✅ Can access all dashboard features

### Test 2: Existing User Google Login
**Time**: ~1 minute

1. Log out (if logged in)
2. Click **"Get Started"** → **"Continue with Google"**
3. Complete Google authentication (same account as before)
4. **Expected**:
   - ✅ Redirected to `/dashboard`
   - ✅ No onboarding modal
   - ✅ User data preserved

### Test 3: Email/Password Signup (Verify Unchanged)
**Time**: ~1 minute

1. Clear browser data
2. Click **"Get Started"** → **"Sign up"** tab
3. Create account with email/password
4. **Expected**:
   - ✅ Onboarding modal appears (expected behavior)
   - ✅ Can complete or skip onboarding
   - ✅ Can access dashboard after

---

## 🔍 Console Verification

Open browser DevTools (F12) and check console logs:

### Successful OAuth Login Should Show:
```
Checking for redirect result...
✅ User authenticated via redirect: user@example.com
✅ OAuth redirect flag set in sessionStorage
Auth state changed. User: user@example.com
Creating/updating user document...
🔵 OAuth user detected - setting onboardingCompleted: true
✅ User data loaded: user@example.com
🔵 OAuth redirect detected - handling post-login flow
🔵 Redirecting OAuth user to dashboard
```

### If You See Errors:
- Check Firebase configuration
- Verify OAuth redirect URLs in Firebase Console
- Check network tab for failed requests
- Verify Firestore rules allow user document updates

---

## 🐛 Common Issues & Solutions

### Issue: Still seeing onboarding modal after OAuth login
**Solution**: 
- Clear browser cache and sessionStorage
- Check console for errors
- Verify `onboardingCompleted: true` in Firestore

### Issue: Not redirected to dashboard
**Solution**:
- Check if `oauthRedirectCompleted` flag is set in sessionStorage
- Verify `navigate` function is working
- Check if user is on home page (`/`) when redirect should happen

### Issue: Infinite redirect loop
**Solution**:
- Clear sessionStorage: `sessionStorage.removeItem('oauthRedirectCompleted')`
- Refresh page
- Check if flag is being cleared after navigation

### Issue: Existing users still see onboarding
**Solution**:
- Check Firestore console - verify `preferences.onboardingCompleted` is `true`
- Verify Firestore rules allow user document updates
- Check console for merge errors

---

## ✅ Verification Checklist

- [ ] New OAuth user → Dashboard (no onboarding)
- [ ] Existing OAuth user → Dashboard (no onboarding)
- [ ] Email/password user → Onboarding modal (as expected)
- [ ] Console shows correct OAuth flow logs
- [ ] Firestore user document has `onboardingCompleted: true` for OAuth users
- [ ] No console errors
- [ ] No infinite redirects
- [ ] sessionStorage flag is cleared after use

---

## 📝 Manual Firestore Verification

1. Open Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the user document (by email or UID)
4. Check `preferences.onboardingCompleted` field:
   - **OAuth users**: Should be `true`
   - **Email/password users**: Can be `false` or `true` (depending on onboarding completion)

---

## 🚨 If Tests Fail

1. **Check Browser Console**:
   - Look for JavaScript errors
   - Check network requests (especially Firestore writes)
   - Verify sessionStorage flag is set/cleared correctly

2. **Check Firebase Console**:
   - Verify OAuth providers are enabled
   - Check authorized domains
   - Verify Firestore rules

3. **Check Code**:
   - Verify changes are deployed
   - Check file paths are correct
   - Verify imports are correct

4. **Clear Everything**:
   ```javascript
   // Run in browser console
   sessionStorage.clear();
   localStorage.clear();
   // Then refresh page
   ```

---

## 📞 Support

If issues persist:
1. Check `OAUTH_LOGIN_FIX_COMPLETE.md` for detailed documentation
2. Review console logs for specific errors
3. Verify Firebase configuration
4. Check Firestore rules and indexes

---

**Last Updated**: $(date)
**Status**: Ready for Testing

