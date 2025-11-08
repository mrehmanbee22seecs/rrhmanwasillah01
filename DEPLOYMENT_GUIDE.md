# Firestore Rules & Visibility Migration - Deployment Guide

## Summary of Changes

This deployment fixes two critical issues preventing public projects/events from displaying:

1. **Firestore Rules Updated**: Security rules now allow unauthenticated users to read `project_submissions` and `event_submissions` where `status == 'approved'` AND `isVisible == true`
2. **Migration Tool Added**: Browser-based migration script to set `isVisible: true` for all approved submissions
3. **Composite Indexes**: Already configured correctly in `firestore.indexes.json`

## Files Changed

1. `/firestore.rules` - Updated security rules to allow public reads for approved+visible submissions
2. `/src/utils/runMigration.ts` - New migration runner utility
3. `/src/App.tsx` - Loads migration tools into browser console

## Step-by-Step Deployment

### STEP 1: Confirm Firebase Project ID

The app is configured to use Firebase project: **`wasilah-new`**

Verify by checking:
- `src/config/firebase.ts` shows `projectId: "wasilah-new"`
- This matches the Firebase Console project

### STEP 2: Deploy Firestore Rules

**Option A: Using Firebase Console (Recommended if CLI fails)**

1. Go to [Firebase Console](https://console.firebase.google.com/project/wasilah-new/firestore/rules)
2. Copy the contents of `/firestore.rules` from this repository
3. Paste into the Rules editor
4. Click "Publish"
5. Confirm the rules are published (check timestamp)

**Option B: Using Firebase CLI (Requires proper permissions)**

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes --project wasilah-new
```

**If you get permission errors:**
- Error message: `Service Usage API has not been used in project...`
- Solution: You need "Firebase Admin" or "Editor" role on the project
- Ask the project owner to add you via: [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=wasilah-new)

### STEP 3: Verify Indexes Are Ready

1. Go to [Firestore Indexes](https://console.firebase.google.com/project/wasilah-new/firestore/indexes)
2. Check that these two composite indexes exist and show **"Ready"** status:

   **Index 1: project_submissions**
   - Collection: `project_submissions`
   - Fields: `status` (ASC), `isVisible` (ASC), `submittedAt` (DESC)

   **Index 2: event_submissions**
   - Collection: `event_submissions`
   - Fields: `status` (ASC), `isVisible` (ASC), `submittedAt` (DESC)

3. If indexes are missing or building, they were already added to `firestore.indexes.json` and should be created automatically when rules are deployed

### STEP 4: Run Data Migration

The migration sets `isVisible: true` for all approved submissions.

**Run in Browser Console:**

1. Open the deployed site in a browser
2. **Login as an admin user** (migration needs authenticated access)
3. Open DevTools Console (F12)
4. You should see: `🔧 Migration Tools Loaded`
5. Run the migration:
   ```javascript
   await runVisibilityMigration()
   ```
6. Wait for completion message showing:
   ```
   === MIGRATION COMPLETE ===
   Projects updated: X
   Events updated: Y
   No errors encountered!
   ```

**To migrate a single document:**
```javascript
await migrateSubmission('project', 'document-id-here')
await migrateSubmission('event', 'document-id-here')
```

### STEP 5: Verify Data in Firestore Console

1. Go to [Firestore Data](https://console.firebase.google.com/project/wasilah-new/firestore/data)
2. Check sample documents in `project_submissions` and `event_submissions`
3. For documents with `status: "approved"`, verify:
   - Field `isVisible` exists
   - Value is exactly boolean `true` (not string "true")
   - Field `status` is exactly string `"approved"` (not "Approved" or other)

### STEP 6: Test Public Access

**In Incognito/Private Browser Window:**

1. Open the deployed site (not logged in)
2. Navigate to `/projects` page
3. Navigate to `/events` page
4. Open DevTools Console (F12)
5. **Verify NO errors** such as:
   - ❌ `permission-denied` errors
   - ❌ `Missing or insufficient permissions`
   - ❌ `FirebaseError: Missing index`
6. **Verify pages display** approved+visible projects/events

### STEP 7: Document Results

Take screenshots of:

1. **Firebase Console - Rules Tab**
   - Showing the updated rules published with recent timestamp

2. **Firebase Console - Indexes Tab**
   - Showing both composite indexes with "Ready" status

3. **Browser Console - Migration Output**
   - Showing number of documents updated

4. **Incognito Browser - Projects Page**
   - Showing projects loaded with no console errors

5. **Incognito Browser - Events Page**
   - Showing events loaded with no console errors

## Expected Query Behavior

**Before Fix:**
- Unauthenticated users: ❌ Permission denied
- Query returned: 0 results

**After Fix:**
- Unauthenticated users: ✅ Can read approved+visible submissions
- Query filters: `status == 'approved' && isVisible == true`
- Query returns: All approved+visible projects/events

## Troubleshooting

### Issue: "permission-denied" still appearing

**Check:**
1. Rules deployed? (Check timestamp in Firebase Console)
2. Query uses exact filters: `where('status', '==', 'approved')` and `where('isVisible', '==', true)`
3. Documents have `isVisible: true` (boolean, not string)
4. Documents have `status: "approved"` (exact string match)

### Issue: "Missing index" error

**Check:**
1. Indexes deployed? (Should auto-deploy with rules)
2. Index status is "Ready" (not "Building")
3. Console error includes a link to create the index - click it and wait

### Issue: No documents appearing

**Check:**
1. Do documents exist in Firestore? (Check Console)
2. Are documents approved? (`status == 'approved'`)
3. Are documents visible? (`isVisible == true`)
4. Run migration again if needed

### Issue: Migration fails

**Check:**
1. Are you logged in as admin?
2. Admin user has `isAdmin: true` in `users` collection?
3. Check browser console for specific error messages

## Rollback Plan

If issues occur, rollback rules:

1. Go to [Firestore Rules History](https://console.firebase.google.com/project/wasilah-new/firestore/rules/history)
2. Click "Restore" on the previous working version
3. Click "Publish"

The previous rules required authentication for all reads, which is secure but prevented public access.

## Contact for Issues

If deployment fails due to permissions:
- Required role: "Firebase Admin" or "Editor"
- Contact: Project owner via Firebase Console IAM settings
- Minimum permission needed: `firestore.rules.create`, `firestore.indexes.create`

## Build Output

```
✓ built in 6.84s
dist/index.html                     0.88 kB │ gzip:   0.46 kB
dist/assets/index-DNkGBApi.css     55.08 kB │ gzip:   9.82 kB
dist/assets/index-BgEdjBH3.js   1,041.59 kB │ gzip: 257.96 kB
```

Build successful. Ready for deployment.
