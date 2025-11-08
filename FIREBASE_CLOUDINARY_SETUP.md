# Firebase + Cloudinary Setup Guide

## Overview
Your application now uses:
- **Firebase Firestore** for all data storage (content, team members, etc.)
- **Cloudinary** for all image uploads and management
- **Supabase Edge Functions** for Cloudinary signature generation (backend service only)

## Firebase Configuration

### 1. Firebase Project Setup
Your Firebase project is already configured:
- Project ID: `wasilah-new`
- Project URL: `wasilah-new.firebaseapp.com`

### 2. Firestore Database

#### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

#### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

#### Collections Created Automatically
The app will auto-initialize these collections:
- `content` - Editable page content
- `page_content` - Page-specific sections
- `project_leaders` - Project team members
- `event_organizers` - Event organizers
- `users` - User profiles
- `project_submissions` - Project submissions
- `event_submissions` - Event submissions
- And more...

## Cloudinary Configuration

### 1. Environment Variables
Ensure these are set in your Supabase Edge Function environment:

```env
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 2. How Images Work

#### Upload Flow
1. User selects an image in the UI
2. Frontend requests a signature from Supabase Edge Function
3. Edge Function generates secure signature using Cloudinary API credentials
4. Frontend uploads image directly to Cloudinary with signature
5. Cloudinary returns the image URL
6. URL is saved to Firebase Firestore

#### Components That Handle Images
- `ImageUploadField` - Simple image upload
- `ImageCropUpload` - Upload with cropping
- `CloudinaryImageUpload` - Direct Cloudinary upload
- `EnhancedImageUpload` - Advanced with transformations

## Data Architecture

### Content Management
All editable content is stored in the `content` collection:

```javascript
// Document structure
{
  id: "section_slug",
  section: "hero_content",
  slug: "main",
  data: {
    title: "Your Title",
    subtitle: "Your Subtitle",
    // ... other content fields
  },
  createdAt: "2025-10-09T12:00:00Z",
  updatedAt: "2025-10-09T12:00:00Z"
}
```

### Team Members
Team members are stored in separate collections:
- `project_leaders` - For projects
- `event_organizers` - For events

```javascript
// Document structure
{
  id: "auto-generated-id",
  name: "John Doe",
  role: "Project Lead",
  bio: "Brief biography...",
  profileImage: "https://res.cloudinary.com/...",
  email: "john@example.com",
  phone: "+1234567890",
  projectId: "project-id", // or eventId for organizers
  order: 1,
  createdAt: "2025-10-09T12:00:00Z",
  updatedAt: "2025-10-09T12:00:00Z"
}
```

## Using the Content Management System

### For Admins

#### Edit Page Content
1. Log in as admin
2. Navigate to the page you want to edit
3. Click the edit button on any section
4. Modify content in the modal
5. Click Save

#### Add Team Members
1. Log in as admin
2. Navigate to a project or event page
3. Click "Add New Team Member" button
4. Fill in the form:
   - Upload profile image via Cloudinary
   - Enter name, role, bio
   - Add contact information
   - Add social links (optional)
5. Click Save

#### Edit Team Members
1. Click edit button on any team member card
2. Update information
3. Change or upload new profile image
4. Click Update

### For Developers

#### Fetch Content
```typescript
import { useContent } from '../hooks/useContent';

// Fetch a single content item
const { data, loading } = useContent('hero_content', 'main');

// Fetch multiple items (like programs or testimonials)
const { data: programs } = useContent('programs');
```

#### Update Content
```typescript
const { updateContent } = useContent('programs');

await updateContent('doc-id', {
  title: 'Updated Title',
  description: 'Updated description',
  order: 1
});
```

#### Create Content
```typescript
const { createContent } = useContent('programs');

await createContent({
  title: 'New Program',
  description: 'Program description',
  icon: '📚',
  order: 5
});
```

#### Upload Images
```typescript
import { uploadWithSignature } from '../utils/cloudinarySignedUpload';

const result = await uploadWithSignature({
  file: imageFile,
  folder: 'team-members',
  onProgress: (progress) => console.log(`${progress}%`)
});

const imageUrl = result.secure_url;
```

## Security

### Firestore Rules
- Public users: Read-only access to published content
- Authenticated users: Can create submissions
- Admins: Full CRUD access to all content

### Admin Check
```typescript
function isAdmin() {
  return isAuthenticated() &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### Making a User Admin
Update the user document in Firestore:
```javascript
{
  uid: "user-id",
  email: "admin@example.com",
  isAdmin: true  // Set this to true
}
```

## Troubleshooting

### Images Not Uploading
1. Check Cloudinary credentials in Supabase Edge Function
2. Verify Supabase Edge Function is deployed
3. Check browser console for errors
4. Verify CORS settings in Cloudinary dashboard

### Content Not Saving
1. Check user is logged in as admin
2. Verify Firestore rules are deployed
3. Check browser console for errors
4. Verify Firebase connection in Network tab

### Content Not Loading
1. Check Firebase connection
2. Verify collection exists in Firestore
3. Run initialization: Content auto-initializes on first load
4. Check Firestore indexes are deployed

## Best Practices

### Content Management
1. Always provide meaningful content titles
2. Use descriptive slugs for easy identification
3. Set proper order values for sorted lists
4. Include both createdAt and updatedAt timestamps

### Image Management
1. Always specify a folder for organization
2. Use descriptive public IDs when needed
3. Apply transformations at upload time
4. Delete old images when replacing

### Team Management
1. Use high-quality profile images
2. Keep bios concise and professional
3. Verify contact information accuracy
4. Set appropriate order values for team display

## Deployment Checklist

- [ ] Firebase project configured
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloudinary account created
- [ ] Cloudinary credentials set in Supabase Edge Function
- [ ] Edge Function deployed
- [ ] Admin users configured in Firestore
- [ ] Default content initialized
- [ ] Test admin features
- [ ] Test image uploads
- [ ] Verify public user access
