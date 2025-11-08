# Firebase Backend Setup Guide

This document outlines the complete Firebase backend structure for the Waseela application.

## Firebase Configuration

The application uses Firebase for:
- **Authentication** (Email/Password, Google, Facebook)
- **Firestore Database** (NoSQL document database)
- **Cloud Storage** (Image and file uploads)

## Required Firebase Collections

### 1. `users` Collection
Stores user profile information and preferences.

**Document Structure:**
```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,
  displayName: string,
  photoURL: string | null,
  isAdmin: boolean,              // Admin privileges
  isGuest: boolean,              // Guest user flag
  createdAt: timestamp,
  lastLogin: timestamp,
  preferences: {
    interests: string[],         // User interests
    skills: string[],            // User skills
    availability: string,        // Availability schedule
    theme: string                // Preferred theme
  },
  activityLog: [                 // User activity history
    {
      id: string,
      action: string,
      page: string,
      timestamp: timestamp,
      details: any
    }
  ]
}
```

**Security Rules:**
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
  allow create: if request.auth != null;
}
```

### 2. `project_submissions` Collection
Stores project submissions (both drafts and submitted projects).

**Document Structure:**
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,              // Education, Healthcare, Environment, etc.
  location: string,
  address: string,
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
  expectedVolunteers: number,
  targetAudience: string,
  durationEstimate: string,
  requirements: string[],
  objectives: string[],
  contactEmail: string,
  contactPhone: string,
  budget: string,
  timeline: string,
  notes: string,
  image: string,                 // Cover image URL
  heads: [                       // Project heads/managers
    {
      id: string,
      name: string,
      designation: string,
      image: string
    }
  ],
  checklist: [                   // Task checklist
    {
      id: string,
      text: string,
      completed: boolean,
      completedAt: timestamp,
      completedBy: string
    }
  ],
  reminders: [                   // Reminder notifications
    {
      id: string,
      title: string,
      description: string,
      reminderDate: string,
      reminderTime: string,
      notifyEmails: string[],
      sent: boolean,
      sentAt: timestamp
    }
  ],
  submittedBy: string,           // User UID
  submitterName: string,
  submitterEmail: string,
  status: string,                // draft, pending, approved, rejected
  submittedAt: timestamp,
  reviewedAt: timestamp,
  reviewedBy: string,
  adminComments: string,
  rejectionReason: string,
  auditTrail: [
    {
      action: string,
      performedBy: string,
      performedAt: timestamp,
      details: string,
      previousStatus: string,
      newStatus: string
    }
  ]
}
```

**Security Rules:**
```javascript
match /project_submissions/{submissionId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
    (request.auth.uid == resource.data.submittedBy ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
  allow delete: if request.auth != null &&
    (request.auth.uid == resource.data.submittedBy ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
}
```

### 3. `event_submissions` Collection
Stores event submissions (both drafts and submitted events).

**Document Structure:**
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,              // Community, Health, Education, Training, etc.
  date: string,
  time: string,
  location: string,
  address: string,
  latitude: number,
  longitude: number,
  expectedAttendees: number,
  targetAudience: string,
  durationEstimate: string,
  registrationDeadline: string,
  requirements: string[],
  agenda: string[],
  contactEmail: string,
  contactPhone: string,
  cost: string,
  notes: string,
  image: string,                 // Cover image URL
  heads: [                       // Event organizers
    {
      id: string,
      name: string,
      designation: string,
      image: string
    }
  ],
  checklist: [                   // Task checklist
    {
      id: string,
      text: string,
      completed: boolean,
      completedAt: timestamp,
      completedBy: string
    }
  ],
  reminders: [                   // Reminder notifications
    {
      id: string,
      title: string,
      description: string,
      reminderDate: string,
      reminderTime: string,
      notifyEmails: string[],
      sent: boolean,
      sentAt: timestamp
    }
  ],
  submittedBy: string,           // User UID
  submitterName: string,
  submitterEmail: string,
  status: string,                // draft, pending, approved, rejected
  submittedAt: timestamp,
  reviewedAt: timestamp,
  reviewedBy: string,
  adminComments: string,
  rejectionReason: string,
  auditTrail: [
    {
      action: string,
      performedBy: string,
      performedAt: timestamp,
      details: string,
      previousStatus: string,
      newStatus: string
    }
  ]
}
```

**Security Rules:**
```javascript
match /event_submissions/{submissionId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
    (request.auth.uid == resource.data.submittedBy ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
  allow delete: if request.auth != null &&
    (request.auth.uid == resource.data.submittedBy ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
}
```

### 4. `hero_content` Collection
Stores hero section content for the homepage.

**Document Structure:**
```javascript
{
  title: string,
  subtitle: string,
  description: string,
  ctaText: string,
  ctaLink: string,
  backgroundImage: string,
  lastUpdated: timestamp,
  updatedBy: string
}
```

**Security Rules:**
```javascript
match /hero_content/{docId} {
  allow read: if true;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 5. `programs` Collection
Stores program/service information.

**Document Structure:**
```javascript
{
  title: string,
  description: string,
  icon: string,
  order: number,
  active: boolean,
  createdAt: timestamp
}
```

**Security Rules:**
```javascript
match /programs/{programId} {
  allow read: if true;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 6. `testimonials` Collection
Stores user testimonials.

**Document Structure:**
```javascript
{
  name: string,
  role: string,
  content: string,
  image: string,
  rating: number,
  order: number,
  approved: boolean,
  createdAt: timestamp
}
```

**Security Rules:**
```javascript
match /testimonials/{testimonialId} {
  allow read: if resource.data.approved == true;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 7. `leaders` Collection
Stores organization leader profiles.

**Document Structure:**
```javascript
{
  name: string,
  designation: string,
  bio: string,
  image: string,
  email: string,
  phone: string,
  socialLinks: {
    linkedin: string,
    twitter: string,
    facebook: string
  },
  order: number,
  active: boolean,
  createdAt: timestamp
}
```

**Security Rules:**
```javascript
match /leaders/{leaderId} {
  allow read: if resource.data.active == true;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 8. `editableContent` Collection
Stores editable page content (About, Contact, etc.).

**Document Structure:**
```javascript
{
  pageId: string,                // about, contact, home
  content: any,                  // Page-specific content structure
  lastUpdated: timestamp,
  updatedBy: string
}
```

**Security Rules:**
```javascript
match /editableContent/{docId} {
  allow read: if true;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 9. `volunteer_applications` Collection
Stores volunteer application submissions.

**Document Structure:**
```javascript
{
  name: string,
  email: string,
  phone: string,
  interests: string[],
  skills: string[],
  availability: string,
  experience: string,
  motivation: string,
  status: string,                // pending, approved, rejected
  submittedAt: timestamp,
  submittedBy: string,
  reviewedAt: timestamp,
  reviewedBy: string,
  notes: string
}
```

**Security Rules:**
```javascript
match /volunteer_applications/{applicationId} {
  allow read: if request.auth != null &&
    (request.auth.uid == resource.data.submittedBy ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 10. `contact_messages` Collection
Stores contact form submissions.

**Document Structure:**
```javascript
{
  name: string,
  email: string,
  subject: string,
  message: string,
  timestamp: timestamp,
  status: string,                // unread, read, responded
  response: string,
  respondedAt: timestamp,
  respondedBy: string
}
```

**Security Rules:**
```javascript
match /contact_messages/{messageId} {
  allow read: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
  allow create: if true;
  allow update: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

## Firebase Storage Structure

### Storage Buckets and Folders

```
wasilah-new.firebasestorage.app/
├── uploads/                    # General uploads
├── projects/                   # Project cover images
├── events/                     # Event cover images
├── project-heads/              # Project head profile photos
├── event-organizers/           # Event organizer profile photos
├── leaders/                    # Leader profile photos
├── testimonials/               # Testimonial images
└── hero/                       # Hero section images
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.resource.size < 5 * 1024 * 1024 &&
                      request.resource.contentType.matches('image/.*');
    }

    // Admin-only folders
    match /hero/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Complete Firestore Security Rules

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

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Project submissions
    match /project_submissions/{submissionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
        (isOwner(resource.data.submittedBy) || isAdmin());
      allow delete: if isAuthenticated() &&
        (isOwner(resource.data.submittedBy) || isAdmin());
    }

    // Event submissions
    match /event_submissions/{submissionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
        (isOwner(resource.data.submittedBy) || isAdmin());
      allow delete: if isAuthenticated() &&
        (isOwner(resource.data.submittedBy) || isAdmin());
    }

    // Public readable, admin writable collections
    match /{collection}/{document} {
      allow read: if collection in ['hero_content', 'programs', 'testimonials', 'leaders', 'editableContent'];
      allow write: if collection in ['hero_content', 'programs', 'testimonials', 'leaders', 'editableContent'] && isAdmin();
    }

    // Volunteer applications
    match /volunteer_applications/{applicationId} {
      allow read: if isAuthenticated() &&
        (isOwner(resource.data.submittedBy) || isAdmin());
      allow create: if true;
      allow update: if isAdmin();
    }

    // Contact messages
    match /contact_messages/{messageId} {
      allow read: if isAdmin();
      allow create: if true;
      allow update: if isAdmin();
    }
  }
}
```

## Firebase Indexes Required

Create composite indexes in Firebase Console for optimal query performance:

### Project Submissions Indexes
- Collection: `project_submissions`
  - Fields: `submittedBy` (Ascending), `submittedAt` (Descending)
  - Fields: `status` (Ascending), `submittedAt` (Descending)

### Event Submissions Indexes
- Collection: `event_submissions`
  - Fields: `submittedBy` (Ascending), `submittedAt` (Descending)
  - Fields: `status` (Ascending), `submittedAt` (Descending)

### Programs Index
- Collection: `programs`
  - Fields: `active` (Ascending), `order` (Ascending)

### Leaders Index
- Collection: `leaders`
  - Fields: `active` (Ascending), `order` (Ascending)

## Environment Variables

Ensure these environment variables are set in `.env`:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Initial Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Google Analytics (optional)

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (configure OAuth)
   - Enable Facebook (configure OAuth)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Choose location closest to your users
   - Apply security rules from above

4. **Setup Cloud Storage**
   - Go to Storage
   - Get started
   - Apply storage rules from above
   - Create folder structure

5. **Create Indexes**
   - Go to Firestore Database > Indexes
   - Add composite indexes listed above

6. **Configure First Admin User**
   - After first user signs up, manually update their user document in Firestore
   - Set `isAdmin: true` in the users collection

## Testing Firebase Setup

Run these checks to ensure Firebase is properly configured:

1. Authentication works (sign up, sign in, sign out)
2. User profile is created in `users` collection
3. Image uploads work to Storage
4. Drafts can be saved to Firestore
5. Submissions can be created, read, updated, deleted
6. Admin users can approve/reject submissions
7. Real-time listeners update UI automatically

## Maintenance

- Regularly review security rules
- Monitor Firebase usage in console
- Set up budget alerts
- Clean up unused Storage files
- Archive old submissions
- Backup Firestore data regularly
