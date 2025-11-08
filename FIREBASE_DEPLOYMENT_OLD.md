# Firebase Deployment Guide

This guide will help you deploy the Firebase backend for your Waseela application.

## Prerequisites

1. Node.js and npm installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. A Firebase project created in the Firebase Console
4. Firebase project credentials

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with Google.

## Step 3: Initialize Firebase in Your Project

Navigate to your project directory and run:

```bash
firebase init
```

Select the following services:
- ✅ Firestore
- ✅ Storage
- ✅ Hosting (optional)

### Firestore Setup
- Use the `firestore.rules` file in the project root
- Use the default `firestore.indexes.json` (will be created automatically)

### Storage Setup
- Use the `storage.rules` file in the project root

### Hosting Setup (Optional)
- Public directory: `dist`
- Configure as single-page app: Yes
- Set up automatic builds and deploys with GitHub: Optional

## Step 4: Deploy Security Rules

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This will deploy the rules from `firestore.rules` to your Firebase project.

### Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

This will deploy the rules from `storage.rules` to your Firebase project.

## Step 5: Create Required Indexes

Some queries require composite indexes. Create these in the Firebase Console:

### Go to Firestore Console → Indexes

**Project Submissions Index:**
- Collection: `project_submissions`
- Fields indexed:
  - `submittedBy` (Ascending)
  - `submittedAt` (Descending)
- Query scope: Collection

**Another Index for Status:**
- Collection: `project_submissions`
- Fields indexed:
  - `status` (Ascending)
  - `submittedAt` (Descending)
- Query scope: Collection

**Event Submissions Index:**
- Collection: `event_submissions`
- Fields indexed:
  - `submittedBy` (Ascending)
  - `submittedAt` (Descending)
- Query scope: Collection

**Another Index for Status:**
- Collection: `event_submissions`
- Fields indexed:
  - `status` (Ascending)
  - `submittedAt` (Descending)
- Query scope: Collection

Alternatively, Firebase will prompt you with direct links to create these indexes when you run queries that need them.

## Step 6: Enable Authentication Methods

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the following:
   - ✅ Email/Password
   - ✅ Google (Configure OAuth)
   - ✅ Facebook (Configure OAuth with App ID and Secret)

### Google OAuth Setup
1. The Firebase Console will guide you through setting up Google OAuth
2. Add authorized domains in the Firebase Console

### Facebook OAuth Setup
1. Create a Facebook App at https://developers.facebook.com
2. Get App ID and App Secret
3. Add them to Firebase Authentication settings
4. Add OAuth redirect URI to Facebook App settings

## Step 7: Configure Storage CORS

Create a `cors.json` file:

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

Deploy CORS configuration:

```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

Replace `your-project-id` with your actual Firebase project ID.

## Step 8: Set Up First Admin User

After deploying, you'll need to manually create the first admin user:

1. Sign up a user through your application
2. Go to Firebase Console → Firestore Database
3. Find the user document in the `users` collection
4. Edit the document and set `isAdmin: true`

Alternatively, use the admin credentials defined in the code:
- Email: `admin@wasilah.org`
- Password: `WasilahAdmin2024!`

Sign up with these credentials, and the system will automatically grant admin privileges.

## Step 9: Environment Variables

Make sure your `.env` file has the correct Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can find these values in:
Firebase Console → Project Settings → General → Your apps → Web app

## Step 10: Test Your Deployment

1. **Test Authentication:**
   - Sign up a new user
   - Sign in with email/password
   - Sign in with Google
   - Sign in with Facebook

2. **Test Firestore:**
   - Create a project/event submission
   - Save as draft
   - Edit the draft
   - Submit for review

3. **Test Storage:**
   - Upload an image for a project
   - Upload a profile photo for an event organizer
   - Verify images are accessible

4. **Test Admin Functions:**
   - Sign in as admin
   - Approve/reject submissions
   - Manage content

## Step 11: Deploy Your Application

Build your application:

```bash
npm run build
```

Deploy to Firebase Hosting (if configured):

```bash
firebase deploy --only hosting
```

Or deploy to your preferred hosting service (Netlify, Vercel, etc.)

## Monitoring and Maintenance

### Set Up Budget Alerts

1. Go to Firebase Console → Usage and billing
2. Set budget alerts to avoid unexpected costs
3. Recommended free tier limits:
   - Firestore: 50,000 reads/day
   - Storage: 5 GB stored, 1 GB downloaded/day
   - Authentication: Unlimited

### Monitor Usage

1. Firebase Console → Usage and billing
2. Check Firestore, Storage, and Authentication usage
3. Review Cloud Functions logs if added later

### Backup Strategy

1. Set up automated Firestore exports
2. Go to Firebase Console → Firestore Database → Import/Export
3. Schedule regular exports to Cloud Storage

## Troubleshooting

### Problem: "Permission Denied" errors

**Solution:**
- Check that security rules are deployed
- Verify user authentication status
- Check that user document has correct permissions

### Problem: "Missing or insufficient permissions"

**Solution:**
- Verify Firestore rules are correct
- Check that the user is authenticated
- Ensure admin users have `isAdmin: true` in their user document

### Problem: Images not uploading

**Solution:**
- Check Storage rules are deployed
- Verify file size is under 5MB
- Ensure file type is an image
- Check browser console for specific errors

### Problem: Queries failing

**Solution:**
- Check Firebase Console for index creation prompts
- Create required composite indexes
- Verify collection names match exactly

### Problem: Authentication not working

**Solution:**
- Verify authentication methods are enabled in Firebase Console
- Check OAuth credentials are correct
- Ensure authorized domains are configured

## Security Best Practices

1. **Never commit Firebase credentials to git**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Regularly review security rules**
   - Audit rules monthly
   - Test with different user roles
   - Use Firebase Emulator for testing

3. **Keep Firebase SDK updated**
   ```bash
   npm update firebase
   ```

4. **Enable App Check** (Optional but recommended)
   - Protects your backend from abuse
   - Go to Firebase Console → App Check

5. **Monitor authentication attempts**
   - Set up alerts for suspicious activity
   - Review authentication logs regularly

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Review browser console errors
3. Check Firebase Status Dashboard
4. Consult Firebase documentation
5. Ask in Firebase community forums
