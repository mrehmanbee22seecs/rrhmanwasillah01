# Firebase Deployment Guide - Complete Copy-Paste Ready

## 🚀 Quick Deploy (1 Command)

```bash
firebase deploy --only firestore
```

This deploys both `firestore.rules` and `firestore.indexes.json` from your project.

---

## 📋 What's Being Deployed

### Security Rules (`firestore.rules`)
- ✅ 2 new edit request collections with complete security
- ✅ Updated project_applications and event_registrations for user read access
- ✅ Admin-only approval workflow enforced

### Indexes (`firestore.indexes.json`)
- ✅ 8 composite indexes total (6 new + 2 updated)
- ✅ Optimized for all dashboard and admin panel queries
- ✅ User-specific and status-based filtering

---

## 📖 Step-by-Step Deployment

### Prerequisites

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Verify you're in the correct project
firebase use
```

### Deployment Options

#### Option 1: Deploy Everything (Recommended)

```bash
cd /path/to/your/project
firebase deploy --only firestore
```

**Output:**
```
✔ Deploy complete!
✔ firestore: released rules firestore.rules
✔ firestore: deployed indexes in firestore.indexes.json
```

#### Option 2: Deploy Rules Only

```bash
firebase deploy --only firestore:rules
```

#### Option 3: Deploy Indexes Only

```bash
firebase deploy --only firestore:indexes
```

---

## 🔍 What's New in the Rules

### New Collections

#### `project_application_edit_requests`
```javascript
// Users can create edit requests for their own applications
allow create: if isAuthenticated() && 
                 request.resource.data.userEmail == request.auth.token.email &&
                 request.resource.data.status == 'pending';

// Users can read their own, admins can read all
allow read: if isAuthenticated() && 
               (resource.data.userEmail == request.auth.token.email || isAdmin());

// Only admins can approve/reject
allow update: if isAdmin() &&
                 (request.resource.data.status == 'approved' || 
                  request.resource.data.status == 'rejected');
```

#### `event_registration_edit_requests`
- Same rules as project_application_edit_requests
- Ensures secure edit workflow for event registrations

### Updated Collections

#### `project_applications`
```javascript
// NEW: Users can read their own applications
allow read: if isAuthenticated() && 
  (request.auth.token.email == resource.data.email || isAdmin());

// Only admins can update (for edit approval)
allow update, delete: if isAdmin();
```

#### `event_registrations`
- Same read access pattern as project_applications
- Enables user dashboard functionality

---

## 📊 Indexes Overview

### New Indexes (6)

**For Edit Requests (Project Applications):**
1. `userEmail` ↑ + `submittedAt` ↓
2. `status` ↑ + `submittedAt` ↓
3. `userEmail` ↑ + `status` ↑ + `submittedAt` ↓

**For Edit Requests (Event Registrations):**
4. `userEmail` ↑ + `submittedAt` ↓
5. `status` ↑ + `submittedAt` ↓
6. `userEmail` ↑ + `status` ↑ + `submittedAt` ↓

### Updated Indexes (2)

**For User Dashboard:**
7. `project_applications`: `email` ↑ + `submittedAt` ↓
8. `event_registrations`: `email` ↑ + `submittedAt` ↓

---

## ✅ Verification Steps

### 1. Check Deployment Status

```bash
# View current rules
firebase firestore:rules:get

# List indexes
firebase firestore:indexes
```

### 2. Firebase Console Verification

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Firestore Database** → **Rules** → Verify rules are updated
4. **Firestore Database** → **Indexes** → Check all 8 indexes show "Enabled"

### 3. Test Functionality

Run these tests in your application:

#### Test 1: User Can View Own Applications ✅
```javascript
const q = query(
  collection(db, 'project_applications'),
  where('email', '==', currentUser.email)
);
const snapshot = await getDocs(q);
// Should succeed and return user's applications
```

#### Test 2: User Can Create Edit Request ✅
```javascript
await addDoc(collection(db, 'project_application_edit_requests'), {
  userEmail: currentUser.email,
  status: 'pending',
  // ... other fields
});
// Should succeed
```

#### Test 3: User Cannot Approve Own Request ❌
```javascript
await updateDoc(doc(db, 'project_application_edit_requests', requestId), {
  status: 'approved'
});
// Should fail: "Missing or insufficient permissions"
```

#### Test 4: Admin Can Approve Request ✅
```javascript
// As admin user
await updateDoc(doc(db, 'project_application_edit_requests', requestId), {
  status: 'approved',
  reviewedAt: serverTimestamp()
});
// Should succeed
```

---

## 🛠 Troubleshooting

### Issue: "Missing or insufficient permissions"

**Cause:** Rules not deployed or admin flag not set

**Fix:**
```bash
# Re-deploy rules
firebase deploy --only firestore:rules

# Verify admin user in Firestore:
# users/{userId}/isAdmin = true
```

### Issue: "The query requires an index"

**Cause:** Index not created or still building

**Fix:**
1. Click the error link to auto-create
2. OR manually create in Console
3. Wait 1-5 minutes for build
4. Check status shows "Enabled"

### Issue: Indexes stuck in "Building" state

**Normal:** 1-5 minutes for small datasets

**If longer than 10 minutes:**
1. Check Firebase Console for errors
2. Verify index configuration matches `firestore.indexes.json`
3. Try deleting and recreating the index

### Issue: Rules syntax error

**Fix:**
1. Copy rules from `firestore.rules` exactly as-is
2. Don't modify the rules structure
3. Verify in Firebase Console rules editor

---

## 📁 Files Updated

```
project-root/
├── firestore.rules          ← Updated with edit request rules
├── firestore.indexes.json   ← Updated with 8 indexes
├── firebase.json            ← Points to above files (no change)
└── FIREBASE_DEPLOYMENT.md   ← This guide
```

---

## 🔐 Security Features

**Authentication:**
- ✅ Email-based access control
- ✅ Admin role enforcement
- ✅ User isolation (users only see their own data)

**Data Integrity:**
- ✅ Edit requests require 'pending' status on creation
- ✅ Only admins can change status to 'approved' or 'rejected'
- ✅ Original data never modified until admin approval

**Audit Trail:**
- ✅ All changes logged with timestamps
- ✅ Reviewer information captured
- ✅ Complete history maintained

---

## 📞 Support

**Common Commands:**

```bash
# Check which Firebase project you're using
firebase use

# Switch to different project
firebase use [project-id]

# View deployment history
firebase deploy:history

# Rollback to previous deployment
firebase deploy:rollback firestore [version-id]

# Test rules locally
firebase emulators:start --only firestore
```

**Getting Help:**
- Firebase Docs: https://firebase.google.com/docs/firestore
- Firebase Status: https://status.firebase.google.com
- Community: https://firebase.community

---

## 📝 Deployment Checklist

Before deployment:
- [ ] Code changes committed and pushed
- [ ] Built successfully (`npm run build`)
- [ ] Reviewed `firestore.rules`
- [ ] Reviewed `firestore.indexes.json`
- [ ] Firebase CLI installed and logged in
- [ ] Correct Firebase project selected

After deployment:
- [ ] Rules deployed (check Console)
- [ ] All 8 indexes show "Enabled"
- [ ] Tested user dashboard access
- [ ] Tested edit request creation
- [ ] Tested admin approval workflow
- [ ] Verified no console errors

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Deploy all | `firebase deploy --only firestore` |
| Deploy rules only | `firebase deploy --only firestore:rules` |
| Deploy indexes only | `firebase deploy --only firestore:indexes` |
| View rules | `firebase firestore:rules:get` |
| List indexes | `firebase firestore:indexes` |
| Test locally | `firebase emulators:start` |

---

**Last Updated:** November 5, 2025  
**Version:** 2.0 - Edit Functionality  
**Status:** ✅ Production Ready

**Summary:**
- ✅ Complete copy-paste deployment guide
- ✅ All security rules included in firestore.rules
- ✅ All indexes included in firestore.indexes.json
- ✅ Single command deployment
- ✅ Comprehensive testing procedures
