# Firestore Setup Guide - Edit Functionality

## Required Firestore Security Rules

Add these rules to your `firestore.rules` file to secure the new edit request collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Project Application Edit Requests
    match /project_application_edit_requests/{requestId} {
      // Users can create edit requests for their own applications
      allow create: if isAuthenticated() && 
                       request.resource.data.userEmail == request.auth.token.email &&
                       request.resource.data.status == 'pending';
      
      // Users can read their own edit requests
      // Admins can read all edit requests
      allow read: if isAuthenticated() && 
                     (resource.data.userEmail == request.auth.token.email || isAdmin());
      
      // Only admins can update (approve/reject)
      allow update: if isAdmin() &&
                       (request.resource.data.status == 'approved' || 
                        request.resource.data.status == 'rejected');
      
      // Only admins can delete
      allow delete: if isAdmin();
    }
    
    // Event Registration Edit Requests
    match /event_registration_edit_requests/{requestId} {
      // Users can create edit requests for their own registrations
      allow create: if isAuthenticated() && 
                       request.resource.data.userEmail == request.auth.token.email &&
                       request.resource.data.status == 'pending';
      
      // Users can read their own edit requests
      // Admins can read all edit requests
      allow read: if isAuthenticated() && 
                     (resource.data.userEmail == request.auth.token.email || isAdmin());
      
      // Only admins can update (approve/reject)
      allow update: if isAdmin() &&
                       (request.resource.data.status == 'approved' || 
                        request.resource.data.status == 'rejected');
      
      // Only admins can delete
      allow delete: if isAdmin();
    }
    
    // Project Applications (existing - add update rule)
    match /project_applications/{applicationId} {
      // ... existing rules ...
      
      // Allow admins to update (for edit approval)
      allow update: if isAdmin();
    }
    
    // Event Registrations (existing - add update rule)
    match /event_registrations/{registrationId} {
      // ... existing rules ...
      
      // Allow admins to update (for edit approval)
      allow update: if isAdmin();
    }
    
    // Users collection (needed for admin check)
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Required Firestore Indexes

Create these composite indexes for optimal query performance:

### 1. Project Application Edit Requests

**Collection ID:** `project_application_edit_requests`

**Index 1 - Order by submission time:**
```
Fields:
  - userEmail (Ascending)
  - submittedAt (Descending)
  
Query scope: Collection
```

**Index 2 - Filter by status and order:**
```
Fields:
  - status (Ascending)
  - submittedAt (Descending)
  
Query scope: Collection
```

**Index 3 - User's requests by status:**
```
Fields:
  - userEmail (Ascending)
  - status (Ascending)
  - submittedAt (Descending)
  
Query scope: Collection
```

### 2. Event Registration Edit Requests

**Collection ID:** `event_registration_edit_requests`

**Index 1 - Order by submission time:**
```
Fields:
  - userEmail (Ascending)
  - submittedAt (Descending)
  
Query scope: Collection
```

**Index 2 - Filter by status and order:**
```
Fields:
  - status (Ascending)
  - submittedAt (Descending)
  
Query scope: Collection
```

**Index 3 - User's requests by status:**
```
Fields:
  - userEmail (Ascending)
  - status (Ascending)
  - submittedAt (Descending)
  
Query scope: Collection
```

## How to Apply These Changes

### Security Rules

1. Go to Firebase Console → Your Project → Firestore Database
2. Click on "Rules" tab
3. Copy the rules above and merge with your existing rules
4. Click "Publish" to deploy

**Important:** Make sure to preserve your existing rules and only add the new sections.

### Indexes

**Option 1 - Auto-create (Recommended for Development):**
1. Run the application
2. When you try to query the collections, Firebase will show an error with a link
3. Click the link to auto-create the required index
4. Wait 1-2 minutes for index to build

**Option 2 - Manual Creation:**
1. Go to Firebase Console → Your Project → Firestore Database
2. Click on "Indexes" tab
3. Click "Add Index"
4. For each index above:
   - Select collection
   - Add fields with specified sort order
   - Set query scope to "Collection"
   - Click "Create"

**Option 3 - Use Firebase CLI:**
Create a file `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "project_application_edit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userEmail",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "project_application_edit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "project_application_edit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userEmail",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "event_registration_edit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userEmail",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "event_registration_edit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "event_registration_edit_requests",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userEmail",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submittedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then run:
```bash
firebase deploy --only firestore:indexes
```

## Testing Security Rules

After deploying rules, test them:

### Test 1: User Can Create Own Edit Request
```javascript
// As authenticated user
const editRequest = {
  userEmail: currentUser.email,
  status: 'pending',
  // ... other fields
};
await addDoc(collection(db, 'project_application_edit_requests'), editRequest);
// Should succeed ✓
```

### Test 2: User Cannot Create Edit Request for Others
```javascript
// As authenticated user
const editRequest = {
  userEmail: 'someoneelse@example.com',  // Different email
  status: 'pending',
  // ... other fields
};
await addDoc(collection(db, 'project_application_edit_requests'), editRequest);
// Should fail ✗
```

### Test 3: User Can Read Own Edit Requests
```javascript
// As authenticated user
const q = query(
  collection(db, 'project_application_edit_requests'),
  where('userEmail', '==', currentUser.email)
);
const snapshot = await getDocs(q);
// Should succeed and return user's requests ✓
```

### Test 4: User Cannot Approve Own Edit Request
```javascript
// As regular user (not admin)
await updateDoc(doc(db, 'project_application_edit_requests', requestId), {
  status: 'approved'
});
// Should fail ✗
```

### Test 5: Admin Can Approve Edit Requests
```javascript
// As admin user
await updateDoc(doc(db, 'project_application_edit_requests', requestId), {
  status: 'approved',
  reviewedAt: serverTimestamp(),
  reviewedBy: currentUser.email
});
// Should succeed ✓
```

## Troubleshooting

### Common Issues

**Issue 1: "Missing or insufficient permissions"**
- Cause: Security rules not deployed or incorrect
- Solution: Re-deploy security rules, check admin flag in users collection

**Issue 2: "The query requires an index"**
- Cause: Composite index not created
- Solution: Click the error link to auto-create, or manually create index

**Issue 3: "User not authorized to approve"**
- Cause: User doesn't have admin flag set
- Solution: Set `isAdmin: true` in user's document in `users` collection

**Issue 4: "Cannot read edit requests"**
- Cause: Email mismatch or authentication issue
- Solution: Verify user is authenticated, check email matches in query

### Verification Checklist

Before going to production:
- [ ] Security rules deployed to Firebase
- [ ] All required indexes created (6 total)
- [ ] Indexes show "Enabled" status (not "Building")
- [ ] Admin users have `isAdmin: true` in users collection
- [ ] Test user can create edit request
- [ ] Test user can read own edit requests
- [ ] Test user cannot approve own edits
- [ ] Test admin can approve/reject edits
- [ ] Test admin can update original applications

## Security Best Practices

1. **Never expose admin credentials:** Admin flag should only be set server-side
2. **Validate email ownership:** Always check `request.auth.token.email`
3. **Use serverTimestamp():** For accurate timestamps
4. **Log all admin actions:** Store reviewer email and timestamp
5. **Rate limiting:** Consider implementing rate limits for edit submissions

## Performance Optimization

- **Use indexes:** All queries in the app use the indexes above
- **Limit query results:** Add `.limit(50)` to admin panel queries
- **Cache frequently accessed data:** Consider caching user's own edit requests
- **Monitor costs:** Check Firestore usage in Firebase Console

## Edit Workflow Guarantee

**The implementation ensures:**

### ✅ User Submits Edit Request
- Creates edit request document with `status: 'pending'`
- Stores BOTH `originalData` and `requestedChanges`
- **Original application/registration remains unchanged**
- User sees success message about admin review

### ✅ Admin Approves Request
- **ONLY THEN** are changes applied to original record
- Original document updated with `requestedChanges`
- Edit request marked as `status: 'approved'`
- Timestamp and reviewer recorded

### ✅ Admin Rejects Request
- Edit request marked as `status: 'rejected'`
- Rejection reason stored
- **NO changes to original application/registration**
- Original data remains exactly as it was

### Data Integrity
```
User Edit Flow:
├─ Submit Edit → Creates edit_request (pending)
├─ Original Record: UNCHANGED ✓
├─ Admin Reviews
│  ├─ Approve → Original Record UPDATED ✓
│  └─ Reject → Original Record UNCHANGED ✓
└─ Complete
```

**This ensures:**
- No accidental changes to live data
- Complete audit trail of all edit requests
- Admin has full control over what goes live
- Original data protected until explicit approval

## Summary

**Required Changes:**
1. ✅ Add security rules for 2 new collections
2. ✅ Update rules for existing collections (allow admin updates)
3. ✅ Create 6 composite indexes (3 per collection)
4. ✅ Ensure users collection has admin flags

**Data Integrity Guarantee:**
- ✅ Original data never modified until admin approval
- ✅ Rejection keeps original data intact
- ✅ Complete audit trail maintained
- ✅ Admin has full control

**Estimated Setup Time:** 10-15 minutes

**Index Build Time:** 1-5 minutes (depending on data volume)

---

**Last Updated:** November 5, 2025  
**Version:** 1.1  
**Status:** Ready for Production
