# Firebase Quick Reference Guide

Quick reference for common Firebase operations in the Waseela application.

## Table of Contents
- [Collections Overview](#collections-overview)
- [Common Queries](#common-queries)
- [CRUD Operations](#crud-operations)
- [Image Upload](#image-upload)
- [User Management](#user-management)
- [Security Rules](#security-rules)

## Collections Overview

| Collection | Purpose | Who Can Write |
|------------|---------|---------------|
| `users` | User profiles | User (own), Admin |
| `project_submissions` | Project submissions & drafts | Authenticated users |
| `event_submissions` | Event submissions & drafts | Authenticated users |
| `hero_content` | Homepage hero section | Admin only |
| `programs` | Programs/services | Admin only |
| `testimonials` | User testimonials | Admin only |
| `leaders` | Organization leaders | Admin only |
| `editableContent` | Page content | Admin only |
| `volunteer_applications` | Volunteer forms | Anyone (create), Admin (manage) |
| `contact_messages` | Contact forms | Anyone (create), Admin (manage) |

## Common Queries

### Get User's Submissions

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const getUserSubmissions = async (userId: string, type: 'project' | 'event') => {
  const collectionName = type === 'project' ? 'project_submissions' : 'event_submissions';
  const q = query(
    collection(db, collectionName),
    where('submittedBy', '==', userId),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### Get Drafts

```typescript
const getUserDrafts = async (userId: string) => {
  const projectQuery = query(
    collection(db, 'project_submissions'),
    where('submittedBy', '==', userId),
    where('status', '==', 'draft')
  );

  const eventQuery = query(
    collection(db, 'event_submissions'),
    where('submittedBy', '==', userId),
    where('status', '==', 'draft')
  );

  const [projectSnap, eventSnap] = await Promise.all([
    getDocs(projectQuery),
    getDocs(eventQuery)
  ]);

  return [
    ...projectSnap.docs.map(doc => ({ id: doc.id, type: 'project', ...doc.data() })),
    ...eventSnap.docs.map(doc => ({ id: doc.id, type: 'event', ...doc.data() }))
  ];
};
```

### Get Approved Submissions

```typescript
const getApprovedProjects = async () => {
  const q = query(
    collection(db, 'project_submissions'),
    where('status', '==', 'approved'),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### Real-time Listener

```typescript
import { onSnapshot } from 'firebase/firestore';

const setupRealtimeListener = (userId: string, callback: (data: any[]) => void) => {
  const q = query(
    collection(db, 'project_submissions'),
    where('submittedBy', '==', userId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });

  return unsubscribe; // Call this to stop listening
};
```

## CRUD Operations

### Create Document

```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const createSubmission = async (data: any) => {
  const docRef = await addDoc(collection(db, 'project_submissions'), {
    ...data,
    submittedAt: serverTimestamp(),
    status: 'draft'
  });
  return docRef.id;
};
```

### Read Document

```typescript
import { doc, getDoc } from 'firebase/firestore';

const getSubmission = async (id: string) => {
  const docRef = doc(db, 'project_submissions', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error('Document not found');
  }
};
```

### Update Document

```typescript
import { doc, updateDoc } from 'firebase/firestore';

const updateSubmission = async (id: string, updates: any) => {
  const docRef = doc(db, 'project_submissions', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};
```

### Delete Document

```typescript
import { doc, deleteDoc } from 'firebase/firestore';

const deleteSubmission = async (id: string) => {
  const docRef = doc(db, 'project_submissions', id);
  await deleteDoc(docRef);
};
```

## Image Upload

### Upload Image to Storage

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const uploadImage = async (file: File, folder: string = 'uploads') => {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Create reference
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);

  // Upload
  await uploadBytes(storageRef, file);

  // Get URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};
```

### Delete Image from Storage

```typescript
import { ref, deleteObject } from 'firebase/storage';

const deleteImage = async (imageUrl: string) => {
  // Extract path from URL
  const baseUrl = 'https://firebasestorage.googleapis.com';
  const path = imageUrl.split(baseUrl)[1]?.split('?')[0];

  if (path) {
    const storageRef = ref(storage, decodeURIComponent(path));
    await deleteObject(storageRef);
  }
};
```

## User Management

### Create User Profile

```typescript
import { doc, setDoc } from 'firebase/firestore';

const createUserProfile = async (userId: string, data: any) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    uid: userId,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL || null,
    isAdmin: false,
    isGuest: false,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    preferences: {
      interests: [],
      skills: [],
      availability: '',
      theme: 'default'
    },
    activityLog: []
  });
};
```

### Update User Profile

```typescript
const updateUserProfile = async (userId: string, updates: any) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};
```

### Get User Profile

```typescript
const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
};
```

### Log User Activity

```typescript
const logActivity = async (userId: string, action: string, page: string, details?: any) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentLog = userSnap.data()?.activityLog || [];
    const newActivity = {
      id: `activity_${Date.now()}`,
      action,
      page,
      timestamp: serverTimestamp(),
      details: details || null
    };

    // Keep only last 50 activities
    const updatedLog = [...currentLog, newActivity].slice(-50);

    await updateDoc(userRef, {
      activityLog: updatedLog
    });
  }
};
```

## Security Rules

### Check if User is Admin

```typescript
const isAdmin = async (userId: string): Promise<boolean> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() && userSnap.data()?.isAdmin === true;
};
```

### Check if User Owns Document

```typescript
const isOwner = (userId: string, documentData: any): boolean => {
  return documentData.submittedBy === userId;
};
```

## Batch Operations

### Batch Write

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batchUpdate = async (updates: Array<{ id: string; data: any }>) => {
  const batch = writeBatch(db);

  updates.forEach(update => {
    const docRef = doc(db, 'project_submissions', update.id);
    batch.update(docRef, update.data);
  });

  await batch.commit();
};
```

### Batch Delete

```typescript
const batchDelete = async (ids: string[], collectionName: string) => {
  const batch = writeBatch(db);

  ids.forEach(id => {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  });

  await batch.commit();
};
```

## Pagination

### Paginated Query

```typescript
import { query, collection, orderBy, startAfter, limit, getDocs, DocumentSnapshot } from 'firebase/firestore';

let lastDoc: DocumentSnapshot | null = null;

const getNextPage = async (pageSize: number = 10) => {
  let q = query(
    collection(db, 'project_submissions'),
    orderBy('submittedAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## Error Handling

### Handle Firebase Errors

```typescript
import { FirebaseError } from 'firebase/app';

const handleFirebaseError = (error: any) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action';
      case 'not-found':
        return 'The requested document was not found';
      case 'already-exists':
        return 'This document already exists';
      case 'unauthenticated':
        return 'You must be signed in to perform this action';
      default:
        return `An error occurred: ${error.message}`;
    }
  }
  return 'An unexpected error occurred';
};

// Usage
try {
  await someFirebaseOperation();
} catch (error) {
  const errorMessage = handleFirebaseError(error);
  console.error(errorMessage);
}
```

## Best Practices

1. **Always use serverTimestamp()** for timestamps instead of `Date.now()`
2. **Clean up listeners** when components unmount
3. **Use batch operations** for multiple writes
4. **Handle errors gracefully** with try-catch blocks
5. **Validate data** before writing to Firestore
6. **Use indexes** for complex queries
7. **Keep documents small** (under 1MB)
8. **Use subcollections** for nested data
9. **Cache reads** when possible
10. **Monitor usage** in Firebase Console

## Helpful Commands

```bash
# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy all
firebase deploy

# Start emulators for testing
firebase emulators:start

# View logs
firebase projects:list
firebase database:get / --project PROJECT_ID
```
