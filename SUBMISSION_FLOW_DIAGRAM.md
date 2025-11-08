# Submission & Approval Flow Diagram

## Regular User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REGULAR USER SUBMISSION                       │
└─────────────────────────────────────────────────────────────────────┘

   User logs in
        │
        ▼
   Creates Project/Event
        │
        ▼
   Fills form & submits
        │
        ▼
   ┌─────────────────────────────┐
   │  Document Created:          │
   │  - status: "pending"        │
   │  - isVisible: false         │
   │  - submittedBy: user-uid    │
   └─────────────────────────────┘
        │
        ▼
   ❌ NOT visible on public pages
        │
        ▼
   ✅ Visible in Admin Dashboard
        │
        ▼
   ┌─────────────────────────────┐
   │  Admin Reviews:             │
   │  - Can edit if needed       │
   │  - Can add comments         │
   │  - Decides: Approve/Reject  │
   └─────────────────────────────┘
        │
        ├──────────────┬──────────────┐
        │              │              │
        ▼              ▼              ▼
    APPROVE        REJECT         PENDING
        │              │              │
        ▼              ▼              │
   ┌────────────┐  ┌────────────┐   │
   │ status:    │  │ status:    │   │
   │ "approved" │  │ "rejected" │   │
   │ isVisible: │  │ isVisible: │   │
   │ true       │  │ false      │   │
   └────────────┘  └────────────┘   │
        │              │              │
        ▼              ▼              ▼
   ✅ Shows on    ❌ Hidden      ⏳ Waiting
   public pages   Email sent    for review
```

---

## Admin User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ADMIN SUBMISSION                            │
└─────────────────────────────────────────────────────────────────────┘

   Admin logs in
        │
        ▼
   Creates Project/Event
        │
        ▼
   Fills form & submits
        │
        ▼
   ┌─────────────────────────────┐
   │  Document Created:          │
   │  - status: "approved"  ⚡    │
   │  - isVisible: true     ⚡    │
   │  - submittedBy: admin-uid   │
   └─────────────────────────────┘
        │
        ▼
   ✅ IMMEDIATELY visible on public pages
        │
        ▼
   ✅ Appears in Admin Dashboard
        │
        ▼
   Admin can still:
   - Edit the submission
   - Toggle visibility (eye icon)
   - Delete if needed
```

---

## Visibility Toggle (Admin Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VISIBILITY MANAGEMENT                           │
└─────────────────────────────────────────────────────────────────────┘

   Approved Submission (isVisible: true)
        │
        ▼
   Admin clicks "Hide" (eye icon)
        │
        ▼
   ┌─────────────────────────────┐
   │  Document Updated:          │
   │  - status: "approved"       │
   │  - isVisible: false ⬇       │
   └─────────────────────────────┘
        │
        ▼
   ❌ Hidden from public pages
   ✅ Still in Admin Dashboard
        │
        ▼
   Admin clicks "Show" (eye icon)
        │
        ▼
   ┌─────────────────────────────┐
   │  Document Updated:          │
   │  - status: "approved"       │
   │  - isVisible: true ⬆        │
   └─────────────────────────────┘
        │
        ▼
   ✅ Visible on public pages again
```

---

## Public Page Query Logic

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PUBLIC PAGES (Projects/Events)                    │
└─────────────────────────────────────────────────────────────────────┘

Firestore Query:
┌──────────────────────────────────────┐
│ where('status', '==', 'approved')    │
│ where('isVisible', '==', true)       │
│ orderBy('submittedAt', 'desc')       │
└──────────────────────────────────────┘
        │
        ▼
Only returns documents where BOTH:
   1. status = "approved" (string)
   2. isVisible = true (boolean)
        │
        ▼
Documents shown to:
   ✅ Unauthenticated visitors
   ✅ Logged-in regular users
   ✅ Admin users
```

---

## Admin Dashboard Query Logic

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                              │
└─────────────────────────────────────────────────────────────────────┘

Firestore Query:
┌──────────────────────────────────────┐
│ orderBy('submittedAt', 'desc')       │
│ (NO status filter)                   │
│ (NO isVisible filter)                │
└──────────────────────────────────────┘
        │
        ▼
Returns ALL submissions:
   📋 Pending submissions
   ✅ Approved submissions
   ❌ Rejected submissions
        │
        ▼
Firestore Rules Allow This Because:
   - isAdmin() = true
   - Admin can read ALL documents
```

---

## Firestore Rules Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FIRESTORE RULES LOGIC                         │
└─────────────────────────────────────────────────────────────────────┘

WHO CAN READ PROJECT/EVENT SUBMISSIONS?

1. ADMIN USERS (isAdmin = true)
   ✅ Can read ALL submissions (pending, approved, rejected)
   ✅ No query restrictions

2. SUBMISSION OWNER (submittedBy = user-uid)
   ✅ Can read their OWN submissions
   ✅ Must query with: where('submittedBy', '==', user-uid)

3. PUBLIC (unauthenticated or regular users)
   ✅ Can read ONLY if both:
      - status = "approved"
      - isVisible = true
   ✅ Must query with both filters

4. CREATE/UPDATE/DELETE
   ✅ Create: Any authenticated user
   ✅ Update: Owner OR Admin
   ✅ Delete: Owner OR Admin
```

---

## Error Resolution Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BEFORE FIX (BROKEN)                             │
└─────────────────────────────────────────────────────────────────────┘

Admin approves submission
        │
        ▼
   ❌ serverTimestamp() error
        │
        ▼
   Document NOT updated
        │
        ▼
   Submission disappears on refresh
        │
        ▼
   ❌ Permission denied loading dashboard


┌─────────────────────────────────────────────────────────────────────┐
│                       AFTER FIX (WORKING)                            │
└─────────────────────────────────────────────────────────────────────┘

Admin approves submission
        │
        ▼
   ✅ ISO string timestamp used
        │
        ▼
   Document updated successfully
        │
        ▼
   Submission persists after refresh
        │
        ▼
   ✅ Dashboard loads all submissions
        │
        ▼
   ✅ Public pages show approved items
```

---

## Key Fields Reference

### Required Fields for Public Visibility:
```javascript
{
  status: "approved",        // Must be string "approved"
  isVisible: true,            // Must be boolean true

  // Other required fields:
  title: "...",
  description: "...",
  submittedBy: "user-uid",
  submittedAt: Timestamp,

  // Optional but recommended:
  reviewedAt: "ISO-string",
  reviewedBy: "admin-uid",
  adminComments: "...",
  auditTrail: [...]
}
```

### Status Values:
- `"draft"` - Work in progress
- `"pending"` - Awaiting review
- `"approved"` - Admin approved, may be visible
- `"rejected"` - Admin rejected, not visible

### Visibility Values:
- `true` - Show on public pages (if approved)
- `false` - Hide from public pages

---

## Cloudinary Integration Note

As requested, all image uploads use Cloudinary:
- ✅ Project images → Cloudinary
- ✅ Event images → Cloudinary
- ✅ Head/Organizer photos → Cloudinary
- ✅ All image fields store Cloudinary URLs
- ✅ Firebase Storage NOT used for images

Firestore only stores:
- Document metadata
- Text content
- Cloudinary image URLs (as strings)
