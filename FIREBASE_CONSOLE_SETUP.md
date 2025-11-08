# Firebase Console Setup Guide (No Code Required)

This guide shows you how to set up the chat feature entirely through the Firebase web console - no command line or Node.js needed!

---

## Prerequisites

- ✅ Firebase project created
- ✅ Firestore Database created
- ✅ Firebase Authentication enabled
- ✅ App deployed and users can log in

---

## Method 1: Use the Built-in Setup Page (EASIEST) ⭐

### Step 1: Add Setup Route

Add this route to your `App.tsx`:

```tsx
// In src/App.tsx, add to your Routes:
import AdminSetup from './pages/AdminSetup';

// Add this route inside <Routes>:
<Route path="/admin-setup" element={<AdminSetup />} />
```

### Step 2: Visit the Setup Page

1. Start your app: `npm run dev`
2. Log in to your account
3. Navigate to: `http://localhost:5173/admin-setup`
4. Click "Seed Knowledge Base" button
5. Click "Make Me Admin" button
6. Done! Refresh the page

### Step 3: Remove Setup Page (Security)

After setup is complete, remove or protect the route:

```tsx
// Option 1: Delete the route
// Remove the <Route path="/admin-setup" ... /> line

// Option 2: Protect it (admin-only access)
<Route 
  path="/admin-setup" 
  element={
    isAdmin ? <AdminSetup /> : <Navigate to="/" />
  } 
/>
```

---

## Method 2: Firebase Console (Manual) 

If you prefer not to use the setup page, follow these detailed steps:

### Part A: Deploy Firestore Rules & Indexes

#### 1. Deploy Security Rules

**Via Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select your project
3. Click **Firestore Database** in left menu
4. Click **Rules** tab at the top
5. Replace ALL content with the rules from `/workspace/firestore.rules`
6. Click **Publish**

**Rules to Copy** (from `/workspace/firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    function isOwnerOrAdmin(userId) {
      return isOwner(userId) || isAdmin();
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwnerOrAdmin(userId);
      allow delete: if isAdmin();
    }

    match /users/{userId}/chats/{chatId} {
      allow read, write: if isOwnerOrAdmin(userId);
    }

    match /users/{userId}/chats/{chatId}/messages/{messageId} {
      allow read, write: if isOwnerOrAdmin(userId);
    }

    match /faqs/{faqId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /auditLogs/{logId} {
      allow read, write: if isAdmin();
    }

    // ... rest of your existing rules ...
  }
}
```

#### 2. Create Indexes

**Via Firebase Console:**
1. Still in **Firestore Database**
2. Click **Indexes** tab
3. Click **Add Index** (or use the composite index section)

**Index 1: Chats**
- Collection ID: `chats`
- Query scope: **Collection group**
- Fields to index:
  - Field: `lastActivityAt`, Order: **Descending**
- Click **Create**

**Index 2: Messages**
- Collection ID: `messages`
- Query scope: **Collection group**
- Fields to index:
  - Field: `createdAt`, Order: **Ascending**
- Click **Create**

⏱️ **Wait 5-10 minutes** for indexes to build before continuing.

---

### Part B: Seed Knowledge Base

#### Option 1: Use Admin Setup Page (Recommended)

Follow **Method 1** above - it's much easier!

#### Option 2: Manual Console Entry

1. Go to **Firestore Database** → **Data** tab
2. Click **Start collection**
3. Collection ID: `faqs`
4. Click **Next**

For each FAQ below, click **Add document**:

**FAQ 1:**
- Document ID: (Auto-generate)
- Fields:
  - `question` (string): "What is Wasilah?"
  - `answer` (string): "Wasilah is a community service organization dedicated to creating positive change through education, healthcare, environmental initiatives, and community development projects. We believe in empowering communities and creating sustainable impact through volunteer-driven programs."
  - `keywords` (array): Click "+" → Add strings: "wasilah", "organization", "about", "who", "what", "mission", "vision"
  - `tags` (array): "general", "about"
  - `createdAt` (timestamp): (Use "Set to current time")

**FAQ 2:**
- `question`: "How can I volunteer with Wasilah?"
- `answer`: "You can volunteer by visiting our 'Join Us' page and filling out the volunteer application form. Our team will review your application and contact you within 3-5 business days with available opportunities that match your interests and skills. We welcome volunteers from all backgrounds and experience levels."
- `keywords` (array): "volunteer", "join", "help", "participate", "contribute", "apply", "signup"
- `tags` (array): "volunteer", "join"
- `createdAt`: (current time)

**FAQ 3:**
- `question`: "What types of projects does Wasilah run?"
- `answer`: "We run various projects including education programs (tutoring, scholarship support), healthcare initiatives (free medical camps, health awareness), environmental conservation efforts (tree planting, clean-up drives), and community development projects (infrastructure, skills training). Each project is designed to create lasting positive impact in communities across Pakistan."
- `keywords` (array): "projects", "programs", "initiatives", "types", "work", "activities", "services"
- `tags` (array): "projects", "general"
- `createdAt`: (current time)

**Continue for remaining FAQs...**

📄 **Full FAQ list**: See `/workspace/kb/seed.json` for all 12 FAQs

---

### Part C: Set Admin Users

#### Option 1: Use Admin Setup Page

Follow **Method 1** above.

#### Option 2: Firebase Console

1. **First, have the user log in to your app once**
   - This creates their user document in Firestore

2. Go to **Firestore Database** → **Data** tab

3. Navigate to the `users` collection

4. Find the user document (click on the collection)

5. Click on the user's document (identified by their UID)

6. Click **Add field** button

7. Add this field:
   - Field: `isAdmin`
   - Type: **boolean**
   - Value: **true**

8. Click **Save**

9. **Have the user refresh their browser** to see admin features

**Visual Guide:**
```
users (collection)
  └─ abc123xyz (document - user's UID)
      ├─ email: "user@example.com"
      ├─ displayName: "John Doe"
      └─ isAdmin: true  ← Add this field
```

---

## Verification Steps

### 1. Check Knowledge Base
1. Go to Firestore Database → Data
2. Click on `faqs` collection
3. You should see 12 documents (FAQs)

### 2. Check Admin User
1. Go to Firestore Database → Data
2. Click on `users` collection
3. Find your user document
4. Verify `isAdmin` field is `true`

### 3. Test Chat Widget
1. Log in to your app
2. Look for chat button (bottom-right corner)
3. Click to open chat
4. Type: "What is Wasilah?"
5. Bot should respond with FAQ answer

### 4. Test Admin Panel
1. As admin user, refresh the page
2. You should see an admin toggle appear
3. Click admin toggle → Open admin panel
4. Click "Chats" tab
5. You should see the ChatsPanel interface

---

## Troubleshooting

### Issue: "Permission denied" when seeding
**Solution**: Make sure you deployed the Firestore rules correctly. The rules must include:
```
match /faqs/{faqId} {
  allow read: if true;
  allow write: if isAdmin();
}
```

### Issue: "Missing index" error
**Solution**: 
1. Wait 5-10 minutes after creating indexes
2. Check Firestore Console → Indexes tab
3. Status should be "Enabled" (not "Building")

### Issue: User not showing as admin
**Solution**:
1. Verify `isAdmin` field exists and is `true`
2. Have user **log out and log back in**
3. Or hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Bot not responding
**Solution**:
1. Check if FAQs exist in Firestore
2. Open browser console (F12) and check for errors
3. Verify rules allow reading `faqs` collection

### Issue: Can't see admin panel
**Solution**:
1. Make sure `isAdmin` field is exactly `true` (boolean, not string)
2. Refresh the browser completely
3. Check if AdminToggle component is rendered in App.tsx

---

## Quick Reference

### Collections Created
- `faqs` - Knowledge base entries (12 documents)
- `users/{uid}/chats` - User chat documents
- `users/{uid}/chats/{chatId}/messages` - Chat messages
- `auditLogs` - Admin action logs (optional)

### Required Fields

**FAQ Document:**
```javascript
{
  question: string,
  answer: string,
  keywords: array of strings,
  tags: array of strings,
  createdAt: timestamp
}
```

**User Document (for admin):**
```javascript
{
  email: string,
  displayName: string,
  isAdmin: boolean (true)
}
```

---

## Security Notes

### After Initial Setup:

1. **Remove or protect the `/admin-setup` route**
   ```tsx
   // Delete this line from App.tsx:
   <Route path="/admin-setup" element={<AdminSetup />} />
   ```

2. **Or restrict to existing admins:**
   ```tsx
   <Route 
     path="/admin-setup" 
     element={isAdmin ? <AdminSetup /> : <Navigate to="/" />} 
   />
   ```

3. **Regular security best practices:**
   - Don't share admin credentials
   - Review audit logs regularly
   - Only give admin access to trusted users

---

## Summary

You have two options:

### ⭐ **Easiest: Use Admin Setup Page**
1. Add AdminSetup route to App.tsx
2. Visit `/admin-setup` in browser
3. Click two buttons
4. Done!

### 🔧 **Manual: Firebase Console**
1. Deploy rules and indexes
2. Manually add 12 FAQs (or import JSON)
3. Set `isAdmin: true` for your user
4. Done!

Both methods work perfectly - choose what's most comfortable for you!

---

## Need Help?

- 📖 Full documentation: `WASILAH_CHAT_README.md`
- 🚀 Quick start: `CHAT_DEPLOYMENT_CHECKLIST.md`
- 🔍 Detailed guide: This file!

**Estimated Time**: 
- Method 1 (Setup Page): 5 minutes
- Method 2 (Manual Console): 30 minutes (mostly waiting for indexes)

---

✨ **You're all set!** Your chat feature is now fully configured and ready to use.
