# Visibility System Fix - Complete Deployment Guide

## Overview
This guide provides step-by-step instructions to completely resolve the visibility system bug that prevents approved projects and events from displaying on public pages.

## Issues Fixed
1. Missing Cloudinary environment variables
2. Missing admin controls for delete and hide/show functionality
3. Existing approved records lacking `isVisible` field
4. Inconsistent visibility state management

## Prerequisites
Before deploying these fixes, you need:
1. Firebase project credentials
2. Cloudinary account credentials
3. Admin access to Firebase Console

---

## Step 1: Configure Cloudinary

### Get Your Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Sign up or log in to your account
3. Navigate to **Dashboard** → **Account Details**
4. Copy the following values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Update Environment Variables

Edit `.env` file and replace the placeholder values:

```bash
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
```

### Create Cloudinary Upload Preset

1. In Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `wasilah_unsigned`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `wasilah/uploads`
   - **Access Mode**: `Public`
5. Click **Save**

---

## Step 2: Deploy Firebase Indexes

### Verify Existing Indexes

The required composite indexes are already defined in `firestore.indexes.json`:

```json
{
  "collectionGroup": "project_submissions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isVisible", "order": "ASCENDING" },
    { "fieldPath": "submittedAt", "order": "DESCENDING" }
  ]
}
```

### Deploy Indexes to Firebase

Run the following command:

```bash
firebase deploy --only firestore:indexes
```

**Note**: Index creation can take 5-15 minutes. Monitor progress in Firebase Console.

### Verify Index Status

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wasilah-new`
3. Navigate to **Firestore Database** → **Indexes**
4. Confirm both composite indexes show status: **Enabled**

---

## Step 3: Run Data Migration

The migration script updates all existing approved submissions to have `isVisible: true`.

### Option A: Browser Console Method

1. Build and run the application:
   ```bash
   npm run build
   npm run dev
   ```

2. Open browser DevTools Console (F12)

3. Import and run migration:
   ```javascript
   import { migrateVisibility } from './src/scripts/migrateVisibility';
   await migrateVisibility();
   ```

### Option B: Admin Panel Method

A migration utility can be added to the Admin Panel for easier execution:

1. Log in as admin
2. Open Admin Panel
3. Navigate to Settings tab
4. Click "Run Visibility Migration" button
5. Wait for completion message

### Expected Output

```
Starting visibility migration...
Found 12 project submissions
Found 8 event submissions
Committed batch of 15 updates
Migration completed successfully!
Projects updated: 10
Events updated: 6
```

---

## Step 4: Deploy Application

### Build the Application

```bash
npm run build
```

Ensure build completes without errors.

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### Verify Deployment

1. Visit your production URL
2. Navigate to Projects page
3. Confirm approved projects are visible
4. Navigate to Events page
5. Confirm approved events are visible

---

## Step 5: Deploy Supabase Edge Function

The Cloudinary signature generation function needs to be deployed:

```bash
# Deploy the edge function
npm run deploy:functions
```

Or manually using Supabase CLI:

```bash
supabase functions deploy cloudinary-signature
```

### Set Edge Function Secrets

```bash
supabase secrets set CLOUDINARY_API_SECRET=your-api-secret
supabase secrets set CLOUDINARY_API_KEY=your-api-key
supabase secrets set VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

---

## Verification Checklist

Use this checklist to verify everything works:

### Database & Queries
- [ ] Firebase composite indexes are enabled
- [ ] Approved projects have `isVisible: true`
- [ ] Approved events have `isVisible: true`
- [ ] Queries filter by `status` AND `isVisible`

### Cloudinary Integration
- [ ] Environment variables are set
- [ ] Upload preset exists in Cloudinary
- [ ] Images upload successfully
- [ ] Images display on public pages
- [ ] No "configuration missing" errors

### Admin Panel Functionality
- [ ] Can approve pending submissions
- [ ] Can reject submissions
- [ ] Can toggle visibility (hide/show)
- [ ] Can delete submissions
- [ ] Visibility badge shows correct state
- [ ] All actions update audit trail

### Public Pages Display
- [ ] Projects page loads without errors
- [ ] All approved visible projects display
- [ ] Project images load correctly
- [ ] Events page loads without errors
- [ ] All approved visible events display
- [ ] Event images load correctly

### Visibility Toggle
- [ ] Admin can hide approved project
- [ ] Hidden project disappears from public page
- [ ] Admin can show hidden project
- [ ] Shown project appears on public page
- [ ] Same works for events

---

## Troubleshooting

### Issue: Approved items still not showing

**Solution**:
1. Check browser console for errors
2. Verify Firebase indexes are enabled (not building)
3. Run data migration script again
4. Clear browser cache and reload

### Issue: Cloudinary uploads failing

**Solution**:
1. Verify all environment variables are set correctly
2. Check upload preset exists and is unsigned
3. Verify Edge Function is deployed
4. Check Edge Function logs for errors

### Issue: "Missing composite index" error

**Solution**:
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Wait 10-15 minutes for indexes to build
3. Check index status in Firebase Console
4. Clear application cache

### Issue: Images not loading

**Solution**:
1. Check image URLs are valid Cloudinary URLs
2. Verify Cloudinary cloud name is correct
3. Check browser network tab for 404 errors
4. Ensure images exist in Cloudinary Media Library

---

## Testing Workflow

### Test Complete Flow

1. **Create Submission**:
   - Navigate to "Add New Project"
   - Fill in all required fields
   - Upload an image
   - Submit for review

2. **Admin Review**:
   - Open Admin Panel
   - Navigate to Submissions tab
   - Find pending submission
   - Click "Review"
   - Add comments
   - Click "Approve"

3. **Verify Visibility**:
   - Go to Projects page
   - Confirm new project appears
   - Verify image displays correctly
   - Check all details are visible

4. **Test Hide/Show**:
   - Return to Admin Panel
   - Find approved project
   - Click "Hide" button
   - Verify project disappears from public page
   - Click "Show" button
   - Verify project reappears

5. **Test Delete**:
   - In Admin Panel, click "Delete"
   - Confirm deletion
   - Verify project is permanently removed

---

## Rollback Plan

If issues occur after deployment:

1. **Revert Code**:
   ```bash
   git revert HEAD
   firebase deploy --only hosting
   ```

2. **Restore Visibility**:
   - Run migration script to set all approved items to visible
   - Or manually update in Firebase Console

3. **Check Logs**:
   - Firebase Console → Functions → Logs
   - Browser DevTools → Console
   - Network tab for API errors

---

## Maintenance

### Regular Checks

- Monitor Admin Panel for pending submissions
- Verify new submissions appear after approval
- Check error logs weekly
- Ensure indexes remain enabled

### Future Improvements

1. Add batch operations for hide/show multiple items
2. Implement soft delete with restore capability
3. Add submission analytics dashboard
4. Create automated tests for visibility logic

---

## Support

If you encounter issues not covered in this guide:

1. Check Firebase Console logs
2. Review browser console errors
3. Verify all environment variables
4. Confirm indexes are fully deployed
5. Test with sample data first

---

## Summary

After completing this deployment:
- All approved projects and events will be visible on public pages
- Admins can manage visibility with hide/show controls
- Admins can delete submissions permanently
- Cloudinary image uploads work correctly
- The system maintains proper audit trails
- All queries use optimized composite indexes
