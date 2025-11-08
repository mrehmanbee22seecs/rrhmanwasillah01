# Firestore Index Deployment Fix

## Problem
After logging in, pages appear blank or don't load content. This is because **Firestore composite indexes are not deployed**.

## Root Cause
Your application uses complex Firestore queries that require composite indexes:

1. **Content Collection Query** (used by Home page):
   - Fields: `section` (ASC), `data.order` (ASC)
   
2. **Project Submissions Query** (used by Projects page):
   - Fields: `status` (ASC), `isVisible` (ASC), `submittedAt` (DESC)
   
3. **Event Submissions Query** (used by Events page):
   - Fields: `status` (ASC), `isVisible` (ASC), `submittedAt` (DESC)

When these indexes are missing, Firestore queries fail silently, causing pages to not render properly.

## Solution

### Option 1: Deploy Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy the indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Wait for deployment** (this can take 5-15 minutes):
   - Check status at: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes

### Option 2: Create Indexes Manually in Firebase Console

If you can't use Firebase CLI, create the indexes manually:

1. Go to: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes

2. Click **"Add Index"** for each of these:

   **Index 1: content collection**
   - Collection ID: `content`
   - Fields:
     - `section` → Ascending
     - `data.order` → Ascending
   - Query scope: Collection
   - Click "Create"

   **Index 2: project_submissions collection**
   - Collection ID: `project_submissions`
   - Fields:
     - `status` → Ascending
     - `isVisible` → Ascending
     - `submittedAt` → Descending
   - Query scope: Collection
   - Click "Create"

   **Index 3: event_submissions collection**
   - Collection ID: `event_submissions`
   - Fields:
     - `status` → Ascending
     - `isVisible` → Ascending
     - `submittedAt` → Descending
   - Query scope: Collection
   - Click "Create"

3. Wait for all indexes to finish building (status shows "Enabled")

### Option 3: Use Auto-Generated Index Links

When you open the browser console and try to use the app, Firestore will generate error messages with direct links to create the required indexes. Click those links to automatically create the indexes.

## Verification

After deploying indexes:

1. Open your app in a browser
2. Open browser console (F12)
3. Login to the application
4. You should see messages like:
   ```
   ✓ Loaded X items for section: programs
   ✓ Loaded X approved projects
   ✓ Loaded X approved events
   ```

If you see error messages with "index" in them, the indexes are still not deployed correctly.

## What Was Fixed

I've improved the error handling in your code so that:

1. **Pages render with fallback data** even if Firestore queries fail
2. **Clear error messages** in the console tell you exactly which index is missing
3. **Static content** (like the default projects and events) will still display
4. The app won't show a blank page anymore - it will use default/fallback content

## Testing

After deploying indexes, test these pages:
- ✅ Home page - should load with all sections
- ✅ Projects page - should show both static and user-submitted projects
- ✅ Events page - should show both static and user-submitted events
- ✅ About page - should load editable content
- ✅ Dashboard - should work for logged-in users

## Quick Reference

Current index definitions are in: `firestore.indexes.json`

To check index status:
```bash
firebase firestore:indexes
```

To watch deployment progress:
```bash
firebase firestore:indexes --watch
```

## Common Issues

**Q: Indexes show "Building" for a long time**
A: This is normal for the first deployment. It can take 10-20 minutes.

**Q: I get "PERMISSION_DENIED" errors**
A: Check that you're logged into the correct Firebase project:
```bash
firebase use --list
firebase use YOUR_PROJECT_ID
```

**Q: Index exists but queries still fail**
A: Make sure the index status is "Enabled" not "Building" in the Firebase Console.

## Support

If you continue to have issues after deploying indexes:
1. Check the browser console for specific error messages
2. Verify you're connected to the correct Firebase project
3. Confirm your Firestore security rules match the queries
