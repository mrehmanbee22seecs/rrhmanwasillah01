# Firebase OAuth Diagnostics Guide

## 🔍 Comprehensive Diagnostic Tool Now Available

I've added a comprehensive Firebase diagnostics tool to help identify the exact issue with OAuth login.

## 📊 What's Been Added

### 1. Automatic Diagnostics on Errors
When OAuth login fails, the system now automatically runs diagnostics and logs detailed information to the browser console.

### 2. Manual Diagnostic Tool
You can manually run diagnostics at any time from the browser console.

## 🧪 How to Use the Diagnostics

### Step 1: Open Browser Console
1. Open your browser (Chrome, Firefox, Edge, etc.)
2. Press `F12` or right-click → "Inspect" → "Console" tab
3. Make sure console logging is enabled

### Step 2: Attempt OAuth Login
1. Navigate to your application
2. Click "Get Started"
3. Click "Continue with Google"
4. Complete Google authentication
5. Watch the console output

### Step 3: Run Manual Diagnostics (if needed)
If the automatic diagnostics don't run, or you want to re-run them:

```javascript
// In browser console, type:
window.diagnoseFirebase()
```

This will run a comprehensive test of:
1. Firebase initialization
2. Auth service status
3. Firestore service status
4. Auth state listener
5. Firestore read permissions
6. Firestore write permissions
7. OAuth redirect detection

## 📋 What to Look For

### Critical Error Patterns

#### Pattern 1: Firestore Permission Denied
```
❌ Firestore read error
   Code: permission-denied
```
**Solution**: Check Firestore security rules in Firebase Console

#### Pattern 2: User Document Not Found
```
❌ User document not found in Firestore
```
**Solution**: Document creation is failing - check write permissions

#### Pattern 3: Network/Connection Issues
```
❌ Error code: unavailable
```
**Solution**: Check internet connection or Firebase service status

#### Pattern 4: Auth State Not Persisting
```
⚠️  No user authenticated
```
**Solution**: Browser may be blocking localStorage/sessionStorage

### Expected Successful Output

When everything is working correctly, you should see:

```
🔍 Starting Firebase Diagnostics...
================================================

1️⃣ Testing Firebase Initialization...
✅ Firebase initialized

2️⃣ Testing Auth Service...
✅ User authenticated: user@example.com
   UID: abc123xyz...

3️⃣ Testing Firestore Service...
✅ Firestore service available

4️⃣ Testing Auth State Listener...
✅ Auth state listener working

5️⃣ Testing Firestore Read...
✅ Read user document
   Email: user@example.com
   Onboarding completed: true
   Preferences onboarding: true

6️⃣ Testing Firestore Write...
✅ Write to Firestore successful

7️⃣ Testing OAuth Redirect Result...
✅ OAuth redirect detected
   Email: user@example.com

================================================
📋 DIAGNOSTIC SUMMARY
================================================
✅ Passed: 7
❌ Failed: 0
================================================
```

## 🚨 Common Issues and Solutions

### Issue 1: Firestore Rules Blocking Access

**Symptoms**:
- Error code: `permission-denied`
- Cannot read or write user document

**Solution**:
1. Go to Firebase Console → Firestore Database → Rules
2. Verify this rule exists:
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth.uid == userId;
}
```
3. Click "Publish" to deploy rules

### Issue 2: Firebase Not Initialized

**Symptoms**:
- `auth` or `db` is undefined
- Firebase initialization failed

**Solution**:
1. Check `src/config/firebase.ts` has correct Firebase config
2. Verify Firebase project exists in Firebase Console
3. Check apiKey, projectId, authDomain are correct

### Issue 3: OAuth Redirect Loop

**Symptoms**:
- Keeps redirecting back to Google
- Never completes login

**Solution**:
1. Go to Firebase Console → Authentication → Sign-in method → Google
2. Check "Authorized domains" includes your domain
3. Verify OAuth redirect URI is correctly configured

### Issue 4: User Document Creation Failing

**Symptoms**:
- User authenticated but userData is null
- "User document not found in Firestore"

**Solution**:
1. Check Firestore write rules allow user document creation
2. Verify no Firestore indexes are missing (check Console for index errors)
3. Check Firebase project quota hasn't been exceeded

## 📝 What to Share for Support

If diagnostics show errors, please share:

1. **Full diagnostic output** from console
2. **Error codes** (e.g., `permission-denied`, `unavailable`)
3. **User UID** (shown in diagnostic output)
4. **Which test failed** (numbered 1-7)
5. **Browser and OS** (e.g., Chrome 120 on Windows)

Example of helpful bug report:
```
Test #5 (Firestore Read) failed
Error code: permission-denied
User UID: abc123xyz...
Browser: Chrome 120 on macOS
Full diagnostic output: [paste here]
```

## 🔧 Advanced Debugging

### Check Firestore Directly

In browser console:
```javascript
// Get reference to Firestore
const { getDoc, doc } = window.firestoreExports;
const db = window.db;
const auth = window.auth;

// Try to read your user document
const userRef = doc(db, 'users', auth.currentUser.uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  console.log('User data:', userSnap.data());
} else {
  console.log('User document does not exist');
}
```

### Check Auth State
```javascript
// Check current auth state
console.log('Current user:', window.auth.currentUser);
console.log('Email:', window.auth.currentUser?.email);
console.log('UID:', window.auth.currentUser?.uid);
```

### Check SessionStorage
```javascript
// Check OAuth flag
console.log('OAuth flag:', sessionStorage.getItem('oauthRedirectCompleted'));
```

## 📞 Next Steps

1. **Run the diagnostics** after attempting OAuth login
2. **Copy the full console output** (including all ✅ and ❌)
3. **Share the output** so we can identify the exact failure point
4. **Check Firebase Console** for any errors or warnings

The diagnostics will pinpoint exactly what's failing in the OAuth flow!

---

**Created**: 2025-11-08
**Status**: Active
**Location**: Built into application (no manual setup needed)
