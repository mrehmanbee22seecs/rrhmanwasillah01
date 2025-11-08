# Edit Request Workflow - Data Flow Diagram

## Visual Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER SUBMITS EDIT REQUEST                     │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. User navigates to /my-applications                           │
│  2. Clicks "Edit" on their application/registration              │
│  3. Form opens with pre-filled data                              │
│  4. User modifies fields                                         │
│  5. User clicks "Submit for Review"                              │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│              FIRESTORE: CREATE EDIT REQUEST                      │
├──────────────────────────────────────────────────────────────────┤
│  Collection: project_application_edit_requests                   │
│  (or event_registration_edit_requests)                           │
│                                                                  │
│  Document Structure:                                             │
│  {                                                               │
│    originalApplicationId: "abc123",                              │
│    projectId: "proj456",                                         │
│    projectTitle: "Tree Planting Drive",                          │
│    userEmail: "user@example.com",                                │
│    originalData: { /* COMPLETE ORIGINAL DATA */ },               │
│    requestedChanges: { /* ONLY MODIFIED FIELDS */ },             │
│    status: "pending",  ◄─── PENDING STATUS                      │
│    submittedAt: Timestamp,                                       │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│          ORIGINAL APPLICATION/REGISTRATION                       │
│                  REMAINS UNCHANGED ✓✓✓                          │
├──────────────────────────────────────────────────────────────────┤
│  Collection: project_applications                                │
│  Document ID: abc123                                             │
│                                                                  │
│  {                                                               │
│    name: "John Doe",          ◄─── ORIGINAL VALUE               │
│    email: "john@example.com", ◄─── ORIGINAL VALUE               │
│    phone: "555-1234",         ◄─── ORIGINAL VALUE               │
│    skills: ["A", "B"],        ◄─── ORIGINAL VALUE               │
│    ... all other fields remain exactly as they were ...          │
│  }                                                               │
│                                                                  │
│  STATUS: LIVE DATA UNCHANGED                                     │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│           USER SEES SUCCESS MESSAGE                              │
├──────────────────────────────────────────────────────────────────┤
│  ✓ Edit Request Submitted!                                       │
│  ✓ Your changes have been submitted for admin review.            │
│  ✓ You will be notified once your changes are reviewed.          │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN REVIEW PANEL                            │
├──────────────────────────────────────────────────────────────────┤
│  Admin opens Admin Panel → "Edit Requests" tab                   │
│                                                                  │
│  Sees pending request with:                                      │
│  • User email                                                    │
│  • Submission timestamp                                          │
│  • Status badge: PENDING                                         │
│  • Diff view (red=original, green=requested)                     │
└──────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐
         │  ADMIN APPROVES  │      │  ADMIN REJECTS   │
         └──────────────────┘      └──────────────────┘
                    │                         │
                    ▼                         ▼
    ┌───────────────────────────┐  ┌─────────────────────────┐
    │  APPROVE WORKFLOW         │  │  REJECT WORKFLOW        │
    ├───────────────────────────┤  ├─────────────────────────┤
    │  1. Admin clicks Approve  │  │  1. Admin clicks Reject │
    │  2. Confirmation shown    │  │  2. Enters reason       │
    │  3. Admin confirms        │  │  3. Confirms rejection  │
    └───────────────────────────┘  └─────────────────────────┘
                    │                         │
                    ▼                         ▼
    ┌───────────────────────────┐  ┌─────────────────────────┐
    │  UPDATE ORIGINAL RECORD   │  │  MARK REQUEST REJECTED  │
    ├───────────────────────────┤  ├─────────────────────────┤
    │  Firestore:               │  │  Firestore:             │
    │  project_applications     │  │  edit_requests only     │
    │                           │  │                         │
    │  APPLY requestedChanges:  │  │  Update edit_request:   │
    │  {                        │  │  {                      │
    │    name: "Jane Doe",      │  │    status: "rejected",  │
    │    phone: "555-5678",     │  │    reviewedAt: now,     │
    │    skills: ["X", "Y"],    │  │    reviewedBy: admin,   │
    │    updatedAt: now,        │  │    reviewNotes: reason  │
    │  }                        │  │  }                      │
    │                           │  │                         │
    │  ✓ CHANGES NOW LIVE       │  │  ✓ REQUEST REJECTED     │
    └───────────────────────────┘  └─────────────────────────┘
                    │                         │
                    ▼                         ▼
    ┌───────────────────────────┐  ┌─────────────────────────┐
    │  UPDATE EDIT REQUEST      │  │  ORIGINAL DATA INTACT   │
    ├───────────────────────────┤  ├─────────────────────────┤
    │  {                        │  │  project_applications   │
    │    status: "approved",    │  │  Document: UNCHANGED    │
    │    reviewedAt: now,       │  │                         │
    │    reviewedBy: admin      │  │  {                      │
    │  }                        │  │    name: "John Doe",    │
    └───────────────────────────┘  │    phone: "555-1234",   │
                    │                │    skills: ["A", "B"]  │
                    │                │  }                      │
                    │                │                         │
                    │                │  ✓ NO CHANGES APPLIED   │
                    │                └─────────────────────────┘
                    │                         │
                    └─────────┬───────────────┘
                              ▼
              ┌───────────────────────────┐
              │   ADMIN PANEL REFRESHES   │
              ├───────────────────────────┤
              │  • Edit request list      │
              │  • Application list       │
              │  • Status updated         │
              │  • Success message shown  │
              └───────────────────────────┘
```

## Key Guarantees

### 🔒 Data Protection

**Before Admin Action:**
```javascript
// Original application in Firestore
{
  id: "abc123",
  name: "John Doe",
  email: "john@example.com",
  phone: "555-1234",
  skills: ["JavaScript", "React"]
}

// Edit request (separate document)
{
  originalApplicationId: "abc123",
  status: "pending",
  requestedChanges: {
    name: "Jane Doe",
    phone: "555-5678"
  }
}

// ✓ Original application unchanged
// ✓ Edit request stored separately
```

**After Admin Approval:**
```javascript
// Original application UPDATED
{
  id: "abc123",
  name: "Jane Doe",          // ← CHANGED
  email: "john@example.com", // ← UNCHANGED
  phone: "555-5678",         // ← CHANGED
  skills: ["JavaScript", "React"], // ← UNCHANGED
  updatedAt: "2025-11-05T10:00:00Z"
}

// Edit request marked approved
{
  originalApplicationId: "abc123",
  status: "approved",        // ← STATUS CHANGED
  reviewedAt: "2025-11-05T10:00:00Z",
  reviewedBy: "admin@example.com"
}

// ✓ Changes now live
// ✓ Audit trail preserved
```

**After Admin Rejection:**
```javascript
// Original application UNCHANGED
{
  id: "abc123",
  name: "John Doe",          // ← STILL ORIGINAL
  email: "john@example.com", // ← STILL ORIGINAL
  phone: "555-1234",         // ← STILL ORIGINAL
  skills: ["JavaScript", "React"] // ← STILL ORIGINAL
}

// Edit request marked rejected
{
  originalApplicationId: "abc123",
  status: "rejected",        // ← STATUS CHANGED
  reviewedAt: "2025-11-05T10:00:00Z",
  reviewedBy: "admin@example.com",
  reviewNotes: "Incomplete information" // ← REASON STORED
}

// ✓ Original data intact
// ✓ No changes applied
// ✓ Reason documented
```

## Code Implementation

### User Submission (EditApplicationModal.tsx)
```typescript
// Line 84-93
await addDoc(collection(db, 'project_application_edit_requests'), {
  originalApplicationId: application.id,
  projectId: application.projectId,
  projectTitle: application.projectTitle,
  userEmail: application.email,
  originalData: application,          // Complete original
  requestedChanges,                   // Only modifications
  status: 'pending',                  // Awaiting review
  submittedAt: serverTimestamp(),
});
// ✓ Original application NOT touched
```

### Admin Approval (AdminPanel.tsx)
```typescript
// Line 562-567
const originalRef = doc(db, originalCollectionName, originalId);
await updateDoc(originalRef, {
  ...editRequest.requestedChanges,  // Apply changes
  updatedAt: serverTimestamp(),
});
// ✓ Changes applied to original ONLY on approval
```

### Admin Rejection (AdminPanel.tsx)
```typescript
// Line 595-600
await updateDoc(editRequestRef, {
  status: 'rejected',
  reviewedAt: serverTimestamp(),
  reviewedBy: currentUser?.email || 'admin',
  reviewNotes: reason,
});
// ✓ Only edit request updated, original untouched
```

## Security Enforcement

Firestore rules ensure:
- Users can only create edit requests (not modify originals)
- Only admins can update original applications/registrations
- Edit requests must start with status='pending'
- Admins can only set status to 'approved' or 'rejected'

## Audit Trail

Every action is logged:
```
Edit Request Created:
├─ submittedAt: timestamp
├─ userEmail: requester
└─ status: "pending"

Edit Request Reviewed:
├─ reviewedAt: timestamp
├─ reviewedBy: admin email
├─ status: "approved" or "rejected"
└─ reviewNotes: (if rejected)

Original Record Updated:
└─ updatedAt: timestamp (only if approved)
```

## Testing Scenarios

### Scenario 1: Happy Path (Approval)
1. User edits application ✓
2. Edit request created with status='pending' ✓
3. Original application unchanged ✓
4. Admin reviews and approves ✓
5. Original application updated with changes ✓
6. Edit request marked as approved ✓

### Scenario 2: Rejection Path
1. User edits application ✓
2. Edit request created with status='pending' ✓
3. Original application unchanged ✓
4. Admin reviews and rejects with reason ✓
5. Original application remains unchanged ✓
6. Edit request marked as rejected with reason ✓

### Scenario 3: Multiple Edit Requests
1. User submits Edit A ✓
2. User submits Edit B ✓
3. Both pending, original unchanged ✓
4. Admin approves Edit A ✓
5. Original updated with Edit A changes ✓
6. Admin rejects Edit B ✓
7. Original keeps Edit A changes (Edit B ignored) ✓

## Conclusion

**The implementation GUARANTEES:**
- ✅ Original data never changes until admin approval
- ✅ Rejection keeps original data completely intact
- ✅ Complete separation between edit requests and live data
- ✅ Full audit trail of all changes
- ✅ Admin has complete control over what goes live

**No accidental changes possible!**

---

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Status:** Production-Ready
