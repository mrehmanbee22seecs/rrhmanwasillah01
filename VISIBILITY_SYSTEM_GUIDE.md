# Project & Event Visibility System

## Overview

The visibility system controls which approved projects and events appear on the public Projects and Events pages. This ensures admins have full control over what content is publicly visible.

## How It Works

### 1. Submission Lifecycle

```
Draft → Pending → Approved (isVisible: true) → Public Display
                ↓
              Rejected (isVisible: false)
```

### 2. Visibility Field

**Field**: `isVisible` (boolean)
**Purpose**: Controls public visibility of approved submissions
**Default**: `false` for pending/rejected, `true` when approved

### 3. Automatic Visibility Toggle

When an admin approves a submission:
- `status` is set to `'approved'`
- `isVisible` is automatically set to `true`
- The submission becomes visible on public pages

When an admin rejects a submission:
- `status` is set to `'rejected'`
- `isVisible` is automatically set to `false`
- The submission is hidden from public pages

## Public vs Admin-Only Information

### Public Information (Visible to All Users)
- Project/Event title
- Description
- Category
- Location
- Date/time information
- Contact details (email/phone)
- Images
- Expected volunteers/attendees
- Timeline/deadlines
- Budget (for projects)
- Cost (for events)

### Admin-Only Information (Hidden from Public)
- Submitter's user ID
- Submission status (draft/pending/approved/rejected)
- Admin comments
- Rejection reasons
- Review timestamps
- Reviewer ID
- Audit trail
- Internal notes
- `isVisible` flag

## Database Queries

### Projects Page
```typescript
const q = query(
  collection(db, 'project_submissions'),
  where('status', '==', 'approved'),
  where('isVisible', '==', true),
  orderBy('submittedAt', 'desc')
);
```

### Events Page
```typescript
const q = query(
  collection(db, 'event_submissions'),
  where('status', '==', 'approved'),
  where('isVisible', '==', true),
  orderBy('submittedAt', 'desc')
);
```

## Firebase Indexes Required

For efficient querying, create composite indexes:

### Project Submissions
```
Collection: project_submissions
Fields: status (Ascending), isVisible (Ascending), submittedAt (Descending)
```

### Event Submissions
```
Collection: event_submissions
Fields: status (Ascending), isVisible (Ascending), submittedAt (Descending)
```

## Admin Controls

### Approving Submissions
1. Admin reviews submission in Dashboard
2. Admin clicks "Approve"
3. System automatically:
   - Sets `status: 'approved'`
   - Sets `isVisible: true`
   - Records audit trail
   - Sends email notification to submitter
4. Submission appears on public pages immediately

### Rejecting Submissions
1. Admin reviews submission in Dashboard
2. Admin provides rejection reason
3. Admin clicks "Reject"
4. System automatically:
   - Sets `status: 'rejected'`
   - Sets `isVisible: false`
   - Records rejection reason
   - Sends email notification to submitter
5. Submission remains hidden from public

### Manual Visibility Control (Future Enhancement)
Admins could toggle visibility independently of approval status:
- Temporarily hide approved content for updates
- Preview content before making it public
- Schedule content publication

## User Experience

### Submitters
- Can create and submit projects/events
- See their own submissions in Dashboard (all statuses)
- Receive email notifications on status changes
- Cannot see admin comments or audit trail

### Public Users
- See only approved AND visible submissions
- Cannot see draft, pending, or rejected submissions
- Cannot see submitter information
- Cannot see admin workflow details

### Admins
- See all submissions regardless of status
- Can approve/reject with comments
- Can see full audit trail
- Control what appears on public pages

## Benefits

1. **Quality Control**: Only approved content appears publicly
2. **Content Safety**: Prevents inappropriate submissions from being displayed
3. **Admin Flexibility**: Full control over public-facing content
4. **User Privacy**: Submitter details remain private
5. **Workflow Management**: Clear separation between internal workflow and public display

## Implementation Files

- **Types**: `src/types/submissions.ts` - Added `isVisible` field
- **Admin Panel**: `src/components/AdminPanel.tsx` - Auto-sets visibility on approval
- **Projects Page**: `src/pages/Projects.tsx` - Filters by approved + visible
- **Events Page**: `src/pages/Events.tsx` - Filters by approved + visible

## Testing Checklist

- [ ] Create a new project submission
- [ ] Verify it doesn't appear on Projects page (pending)
- [ ] Approve it as admin
- [ ] Verify it appears on Projects page
- [ ] Create a new event submission
- [ ] Reject it as admin
- [ ] Verify it doesn't appear on Events page
- [ ] Check that static projects/events still display
- [ ] Verify submitters can see their own submissions in Dashboard
