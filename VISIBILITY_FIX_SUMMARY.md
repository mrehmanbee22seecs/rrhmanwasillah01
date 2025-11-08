# Visibility Fix for Approved Projects/Events

## Problem
Approved projects and events were not visible to users on the Projects and Events pages.

## Root Cause
Existing approved submissions in Firestore did not have the `isVisible` field set to `true`. While the approval flow was correctly setting this field for new approvals, historical approved items were missing this field.

## Solution Implemented

### 1. Backend Logic (Already Correct)
- `AdminPanel.tsx` line 185: When approving submissions, `isVisible: status === 'approved'` is set
- Firestore indexes are properly configured for compound queries

### 2. Frontend Queries (Already Correct)
- `Projects.tsx` line 116: Queries for `status == 'approved' AND isVisible == true`
- `Events.tsx` line 128: Queries for `status == 'approved' AND isVisible == true`

### 3. Migration Utility (NEW)
Created `/src/utils/migrateVisibility.ts`:
- Function `migrateApprovedSubmissions()` updates all existing approved submissions
- Sets `isVisible: true` for all approved projects and events
- Adds `updatedAt` timestamp

### 4. Admin Panel Integration (NEW)
- Added "Fix Visibility" button in AdminPanel submissions tab
- Button runs migration to fix all existing approved items
- Shows progress indicator during migration
- Displays count of updated items

## How to Use

### For Admin Users:
1. Log in as an admin
2. Open the Admin Panel (gear icon)
3. Go to "Submissions" tab
4. Click "Fix Visibility" button
5. Confirm the migration
6. Wait for completion message showing how many items were updated

### For Developers:
The migration can also be run programmatically:
```typescript
import { migrateApprovedSubmissions } from './utils/migrateVisibility';

const result = await migrateApprovedSubmissions();
console.log(`Updated ${result.updatedProjects} projects and ${result.updatedEvents} events`);
```

## What This Fixes
- All approved projects will now appear on the /projects page
- All approved events will now appear on the /events page
- New approvals will continue to work correctly
- Visibility can be toggled individually via the eye icon in AdminPanel

## Technical Details

### Firestore Collections Affected:
- `project_submissions`
- `event_submissions`

### Fields Updated:
- `isVisible`: Set to `true` for approved items
- `updatedAt`: Timestamp of migration

### Indexes Required (Already Configured):
```json
{
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isVisible", "order": "ASCENDING" },
    { "fieldPath": "submittedAt", "order": "DESCENDING" }
  ]
}
```

## Testing Checklist
- [x] Build completes without errors
- [ ] Admin can run migration from Admin Panel
- [ ] Migration updates correct number of documents
- [ ] Projects page shows approved and visible projects
- [ ] Events page shows approved and visible events
- [ ] New approvals continue to set isVisible correctly
- [ ] Visibility toggle still works in Admin Panel

## Files Modified
1. `/src/utils/migrateVisibility.ts` - NEW migration utility
2. `/src/components/AdminPanel.tsx` - Added migration button and handler
3. This document - Implementation summary
