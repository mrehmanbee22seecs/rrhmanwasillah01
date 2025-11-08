# Wasilah Support Chat Widget - Complete Setup Guide

## Overview

A complete Firebase-based in-app chat feature with AI-powered bot responses using a knowledge base, admin takeover capabilities, and real-time messaging. **Fully compatible with Firebase Spark (free) plan** - no external APIs or paid services required.

## Features

✅ **Real-time chat** for authenticated users  
✅ **Template-based bot** with keyword and fuzzy matching from Firestore KB  
✅ **Admin panel** to view all chats and take over conversations  
✅ **Client-side rate limiting** (5 messages/minute)  
✅ **Profanity filtering** (redacts banned words)  
✅ **Chat history** with active/closed status  
✅ **Responsive floating widget** (like donations widget)  
✅ **Works on Spark plan** (optional Cloud Functions for Blaze upgrade)

---

## Architecture

### Data Model

```
users/{uid}/
  └── chats/{chatId}
      ├── title: string
      ├── createdAt: timestamp
      ├── lastActivityAt: timestamp
      ├── isActive: boolean
      ├── memorySummary: string (optional)
      └── takeoverBy: string | null (admin uid)
      └── messages/{messageId}
          ├── sender: 'user' | 'bot' | 'admin'
          ├── text: string
          ├── createdAt: timestamp
          └── meta: object

faqs/{faqId}
  ├── question: string
  ├── answer: string
  ├── keywords: string[]
  └── tags: string[]

auditLogs/{id}
  ├── actorUid: string
  ├── action: string
  ├── payload: object
  └── createdAt: timestamp
```

### Matching Logic

1. **Primary**: Tokenized keyword intersection with `faqs.keywords`
2. **Secondary**: Fuzzy matching (Levenshtein distance)
3. **Combined Score**: 60% question similarity + 40% keyword matching
4. **Context**: Uses last 6 messages for better understanding
5. **Threshold**: Default 0.6 (configurable)
6. **Fallback**: Generic message prompting admin review

---

## Setup Instructions

### 1. Prerequisites

- Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- Firebase Authentication enabled (Email/Password, Google, etc.)
- Firestore Database created in production mode
- Node.js 16+ installed

### 2. Install Dependencies

The required packages are already in your `package.json`. If needed:

```bash
npm install firebase
```

### 3. Deploy Firestore Security Rules

**Option A: Using Firebase CLI (Recommended)**

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

**Option B: Using Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `/workspace/firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

### 4. Deploy Firestore Indexes

**Option A: Using Firebase CLI (Recommended)**

```bash
firebase deploy --only firestore:indexes
```

**Option B: Using Firebase Console**

1. Go to **Firestore Database** → **Indexes**
2. Click **Add Index** and create these composite indexes:

**Index 1: Chats**
- Collection ID: `chats` (collectionGroup)
- Fields: `lastActivityAt` (Descending)
- Query scope: Collection group

**Index 2: Messages**
- Collection ID: `messages` (collectionGroup)
- Fields: `createdAt` (Ascending)
- Query scope: Collection group

> Note: Single-field indexes are auto-created, but collectionGroup indexes must be manually created.

### 5. Seed Knowledge Base

**Method 1: Using Node Script (Recommended)**

```bash
# Make sure your .env or environment has Firebase config
export VITE_FIREBASE_API_KEY="your-api-key"
export VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
export VITE_FIREBASE_PROJECT_ID="your-project-id"
export VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
export VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
export VITE_FIREBASE_APP_ID="your-app-id"

# Run the seed script
node scripts/seedKb.js
```

**Method 2: Manual Import via Firebase Console**

1. Go to **Firestore Database** → **Data**
2. Click **Start collection**
3. Collection ID: `faqs`
4. For each FAQ in `/workspace/kb/seed.json`:
   - Click **Add document**
   - Use auto-generated ID
   - Add fields:
     - `question` (string): The question text
     - `answer` (string): The answer text
     - `keywords` (array): Array of keyword strings
     - `tags` (array): Array of tag strings
     - `createdAt` (timestamp): Current time

**Method 3: Import JSON via Firebase CLI**

```bash
# Install firebase-tools globally
npm install -g firebase-tools

# Use firestore import (requires Blaze plan for large imports)
firebase firestore:import ./kb/ --collection faqs
```

### 6. Set Up Admin Users

To grant admin access to users:

1. Go to **Firestore Database** → **users collection**
2. Find the user document (created after first login)
3. Add field: `isAdmin` (boolean) = `true`

Or programmatically after user signs up:

```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// After user authentication
await setDoc(doc(db, 'users', user.uid), {
  email: user.email,
  displayName: user.displayName,
  isAdmin: true, // Set to true for admin users
  createdAt: new Date()
}, { merge: true });
```

### 7. Add Chat Widget to Your App

The `ChatWidget` component is already created. Import it in your main app:

```tsx
// In App.tsx or main layout
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <>
      {/* Your app content */}
      <ChatWidget />
    </>
  );
}
```

The widget:
- Only shows for authenticated users
- Appears as a floating button in bottom-right
- Opens to full chat interface on click

### 8. Add Admin Panel

For admin users, add the ChatsPanel:

```tsx
// In your admin dashboard
import ChatsPanel from './components/Admin/ChatsPanel';

function AdminDashboard() {
  return (
    <div className="h-screen">
      <ChatsPanel />
    </div>
  );
}
```

### 9. Add Chat History (Optional)

To show chat history in user profile or navigation:

```tsx
import ChatList from './components/ChatList';

<ChatList />
```

---

## Testing

### Unit Tests

Run the matchKb tests:

```bash
npm test src/utils/__tests__/matchKb.test.ts
```

### E2E Test Plan

1. **User Creates Chat**
   - Log in as regular user
   - Open chat widget
   - Send message: "What is Wasilah?"
   - ✅ Verify bot responds with KB answer

2. **Bot Matches FAQ**
   - Send: "How can I volunteer?"
   - ✅ Verify bot finds matching FAQ
   - ✅ Answer should be truncated if > 500 chars

3. **Unknown Query Fallback**
   - Send: "xyz random question 12345"
   - ✅ Verify bot sends fallback message

4. **Admin Takeover**
   - Log in as admin
   - Open Admin → Chats Panel
   - Select a user's chat
   - Click "Enable Takeover"
   - ✅ Verify takeover status changes

5. **Admin Real-time Reply**
   - With takeover enabled, send admin message
   - Check user's chat widget
   - ✅ Message appears in real-time with green badge

6. **Rate Limiting**
   - Send 6 messages quickly (within 1 minute)
   - ✅ 6th message should be blocked with error

7. **Profanity Filter**
   - Send message with banned word (e.g., "damn")
   - ✅ Word should be replaced with asterisks

8. **Chat History**
   - Create multiple chats
   - Close chat widget
   - Reopen and check chat list
   - ✅ All chats visible with timestamps

---

## Optional: Cloud Functions (Blaze Plan)

The system works **fully on Spark plan without Cloud Functions**. However, for enhanced security and features, you can deploy optional Cloud Functions when upgrading to Blaze.

### Benefits of Cloud Functions

- ✅ Server-side rate limiting (more secure)
- ✅ Server-side profanity filtering
- ✅ Audit logging for compliance
- ✅ Chat analytics
- ✅ Automated cleanup of old chats

### Deploying Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:onMessageCreate
```

### Available Functions

1. **onMessageCreate**: Validates and filters messages server-side
2. **generateBotResponse**: Alternative server-side bot matching
3. **logAdminAction**: Audit logs for admin takeover actions
4. **cleanupInactiveChats**: Scheduled cleanup (runs daily)
5. **getChatAnalytics**: HTTP callable function for chat stats

---

## Configuration

### Rate Limiting

Edit `/workspace/src/utils/chatHelpers.ts`:

```typescript
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms
const RATE_LIMIT_MAX = 5; // Max messages per window
```

### Matching Threshold

Edit `/workspace/src/hooks/useChat.ts`:

```typescript
const match = findBestMatch(searchQuery, faqs, 0.6); // 0.6 = 60% threshold
```

Lower threshold = more matches (less strict)  
Higher threshold = fewer matches (more strict)

### Answer Truncation

Edit `/workspace/src/hooks/useChat.ts`:

```typescript
botResponse = truncateAnswer(match.answer, 500); // 500 chars
```

### Profanity Words

Edit `/workspace/src/utils/chatHelpers.ts`:

```typescript
const PROFANITY_WORDS = [
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'dumb'
  // Add more words as needed
];
```

---

## Firestore Rules Summary

- **Users**: Can read/write their own chats only
- **Admins**: Can read/write all chats (identified by `users/{uid}.isAdmin == true`)
- **KB (faqs)**: Read public, write admin only
- **Audit Logs**: Admin read/write only

### Testing Rules

```javascript
// User can read their own chat
match /users/{userId}/chats/{chatId} {
  allow read: if request.auth.uid == userId;
}

// Admin can read any chat
match /users/{userId}/chats/{chatId} {
  allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}

// Anyone can read FAQs
match /faqs/{faqId} {
  allow read: if true;
  allow write: if isAdmin();
}
```

---

## Troubleshooting

### Bot Not Responding

1. **Check FAQ collection exists**: Go to Firestore → `faqs` collection
2. **Verify FAQs have keywords**: Each FAQ needs `keywords` array
3. **Check console for errors**: Open browser DevTools → Console
4. **Test matching manually**:
   ```javascript
   import { findBestMatch } from './utils/matchKb';
   console.log(findBestMatch('volunteer', faqs));
   ```

### Messages Not Appearing

1. **Check authentication**: User must be logged in
2. **Verify Firestore rules deployed**: Test in Firebase Console
3. **Check indexes created**: May need up to 5 minutes to build
4. **Look for permission errors**: Browser console shows rule violations

### Admin Panel Empty

1. **Verify admin status**: Check `users/{uid}.isAdmin == true`
2. **Check queries**: Ensure collectionGroup indexes exist
3. **Reload data**: Refresh page after setting admin status

### Rate Limit Not Working

1. **Check client-side implementation**: See `chatHelpers.ts`
2. **Deploy Cloud Function** for server-side enforcement (optional)
3. **Clear browser storage**: Rate limits stored in memory

### Profanity Filter Not Working

1. **Verify word list**: Check `PROFANITY_WORDS` array
2. **Case sensitivity**: Filter works case-insensitive
3. **Word boundaries**: Uses `\b` regex boundaries

---

## File Structure

```
/workspace/
├── src/
│   ├── components/
│   │   ├── ChatWidget.tsx           # Main chat widget
│   │   ├── ChatList.tsx              # Chat history component
│   │   └── Admin/
│   │       └── ChatsPanel.tsx        # Admin 3-pane interface
│   ├── hooks/
│   │   └── useChat.ts                # Chat hook with real-time updates
│   └── utils/
│       ├── matchKb.ts                # KB matching logic
│       ├── chatHelpers.ts            # Rate limit, profanity filter
│       └── __tests__/
│           └── matchKb.test.ts       # Unit tests
├── kb/
│   └── seed.json                     # KB seed data (12 FAQs)
├── scripts/
│   └── seedKb.js                     # KB seeding script
├── functions/                         # Optional Cloud Functions
│   ├── index.js                      # Function definitions
│   ├── package.json                  # Function dependencies
│   └── .gitignore
├── firestore.rules                   # Security rules
├── firestore.indexes.json            # Index definitions
└── WASILAH_CHAT_README.md           # This file
```

---

## Customization Guide

### Adding New FAQs

**Method 1: Firebase Console**
1. Go to Firestore → `faqs` collection
2. Click **Add document**
3. Add fields: `question`, `answer`, `keywords[]`, `tags[]`

**Method 2: Admin Panel (Future Enhancement)**
```typescript
// Create admin KB management UI
const addFAQ = async (faqData) => {
  await addDoc(collection(db, 'faqs'), {
    question: faqData.question,
    answer: faqData.answer,
    keywords: faqData.keywords,
    tags: faqData.tags,
    createdAt: serverTimestamp()
  });
};
```

### Styling the Widget

Edit `ChatWidget.tsx`:

```tsx
// Change colors
className="bg-blue-600"  // Change to your brand color
className="hover:bg-blue-700"

// Change position
className="fixed bottom-6 right-6"  // Move to left: "left-6"

// Change size
className="w-96 h-[600px]"  // Adjust width/height
```

### Custom Bot Personality

Edit bot responses in `useChat.ts`:

```typescript
// Fallback message
botResponse = "Sorry, I don't have that info yet. Our team will help you soon! 😊";

// Success message prefix
botResponse = "Great question! " + truncateAnswer(match.answer, 500);
```

---

## Performance Optimization

### Firestore Optimization

1. **Use indexes**: All queries already indexed
2. **Limit queries**: Chat list shows 20 most recent
3. **Unsubscribe listeners**: Done automatically in hooks
4. **Offline persistence**:
   ```typescript
   import { enableIndexedDbPersistence } from 'firebase/firestore';
   enableIndexedDbPersistence(db);
   ```

### Client-Side Optimization

1. **Lazy load admin panel**: Use React.lazy()
2. **Memoize components**: Use React.memo() for message items
3. **Debounce search**: In admin user search
4. **Virtualize long lists**: For 100+ messages, use react-window

---

## Security Best Practices

✅ **Implemented**:
- Firestore security rules restrict access by user/admin
- Client-side rate limiting
- Profanity filtering
- Message sender verification (can't spoof admin messages)
- Admin identification via Firestore lookup

⚠️ **Additional Recommendations**:
- Enable App Check for bot protection
- Use reCAPTCHA on signup
- Deploy Cloud Functions for server-side validation
- Monitor audit logs for suspicious activity
- Implement IP-based rate limiting (Blaze plan)

---

## Cost Estimates (Spark Plan Limits)

**Free Tier Limits**:
- Firestore: 50K reads/day, 20K writes/day, 1GB storage
- Authentication: Unlimited
- Hosting: 10GB/month, 360MB/day

**Typical Usage** (100 active users):
- ~1000 reads/day (chat loading)
- ~500 writes/day (messages)
- ~10MB storage (messages + KB)

**Result**: Easily fits within Spark plan for small-medium usage!

---

## Support & Contributing

### Getting Help

1. Check this README first
2. Review Firebase Console → Firestore → Rules (test rules)
3. Check browser console for errors
4. Review Firestore indexes status

### Reporting Issues

Include:
1. Error message from console
2. Steps to reproduce
3. Firebase project settings (rules, indexes)
4. User role (regular user or admin)

---

## Future Enhancements

Possible additions (not included in v1):

- [ ] Rich text formatting (markdown)
- [ ] File attachments (images, PDFs)
- [ ] Chat search functionality
- [ ] Export chat transcripts
- [ ] Multi-language support
- [ ] Voice messages
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Push notifications (FCM)
- [ ] Admin KB management UI
- [ ] Chat analytics dashboard
- [ ] Sentiment analysis
- [ ] Smart suggestions

---

## Changelog

### v1.0.0 (Initial Release)
- ✅ Real-time chat widget
- ✅ KB-powered bot with fuzzy matching
- ✅ Admin takeover capability
- ✅ Chat history management
- ✅ Rate limiting & profanity filter
- ✅ Spark plan compatible
- ✅ Optional Cloud Functions
- ✅ Comprehensive documentation

---

## License

This chat feature is part of the Wasilah project. All rights reserved.

---

## Quick Reference

### Common Commands

```bash
# Seed KB
node scripts/seedKb.js

# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy functions (Blaze only)
firebase deploy --only functions

# Run tests
npm test

# Start dev server
npm run dev
```

### Quick Links

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

**Built with ❤️ for Wasilah Community**
