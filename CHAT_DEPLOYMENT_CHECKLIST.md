# Wasilah Chat Widget - Quick Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Firebase Project Setup
- [ ] Firebase project created
- [ ] Firebase Authentication enabled (Email/Password, Google, etc.)
- [ ] Firestore Database created (production mode)
- [ ] Firebase config added to `src/config/firebase.ts`

### 2. Install Dependencies
```bash
npm install
```

### 3. Deploy Firestore Rules
**Option A: CLI**
```bash
firebase deploy --only firestore:rules
```

**Option B: Console**
- Copy `/workspace/firestore.rules`
- Paste in Firebase Console → Firestore → Rules
- Click Publish

### 4. Deploy Firestore Indexes
**Option A: CLI**
```bash
firebase deploy --only firestore:indexes
```

**Option B: Console**
Create two collectionGroup indexes:
- `chats` → `lastActivityAt` (DESC)
- `messages` → `createdAt` (ASC)

### 5. Seed Knowledge Base
```bash
# Set environment variables first
export VITE_FIREBASE_API_KEY="..."
export VITE_FIREBASE_AUTH_DOMAIN="..."
export VITE_FIREBASE_PROJECT_ID="..."
export VITE_FIREBASE_STORAGE_BUCKET="..."
export VITE_FIREBASE_MESSAGING_SENDER_ID="..."
export VITE_FIREBASE_APP_ID="..."

# Run seed script
npm run seed:kb
```

Or manually import FAQs from `kb/seed.json` via Firebase Console.

### 6. Create Admin User
- [ ] User signs up/logs in
- [ ] Go to Firestore → `users/{uid}`
- [ ] Add field: `isAdmin` = `true`

### 7. Add Components to App
```tsx
// In App.tsx or main layout
import ChatWidget from './components/ChatWidget';
import ChatList from './components/ChatList';

<ChatWidget /> {/* Shows for all authenticated users */}
```

```tsx
// In admin dashboard
import ChatsPanel from './components/Admin/ChatsPanel';

<div className="h-screen">
  <ChatsPanel />
</div>
```

---

## 🧪 Testing Checklist

### User Flow
- [ ] User can log in
- [ ] Chat widget appears (bottom-right floating button)
- [ ] User can send message
- [ ] Bot responds with KB answer
- [ ] Chat history saves and persists
- [ ] User can create new chat
- [ ] User can reopen previous chats

### Bot Matching
- [ ] Test exact keyword match: "How can I volunteer?"
- [ ] Test fuzzy match: "volunter oppertunities" (with typos)
- [ ] Test unknown query: "random xyz 12345" → Fallback message
- [ ] Test context awareness: Multi-turn conversation

### Admin Features
- [ ] Admin user can access ChatsPanel
- [ ] All user chats visible in panel
- [ ] Can select user → chat → see transcript
- [ ] Can toggle takeover
- [ ] Admin messages appear in real-time for user
- [ ] Bot stops responding when takeover active

### Rate Limiting
- [ ] Send 5 messages quickly → Success
- [ ] Send 6th message → Error: "Rate limit exceeded"
- [ ] Wait 1 minute → Can send again

### Profanity Filter
- [ ] Send message with banned word (e.g., "damn")
- [ ] Word replaced with asterisks: "****"

### Real-Time Updates
- [ ] Open chat in two browser windows (same user)
- [ ] Send message in one → Appears in other immediately
- [ ] Admin reply appears for user without refresh

---

## 🚀 Production Deployment

### Before Going Live
- [ ] Test all features in development
- [ ] Run unit tests: `npm test`
- [ ] Build production bundle: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Review Firestore rules for security
- [ ] Verify indexes are built (check Firebase Console)
- [ ] Test with real user accounts
- [ ] Set up monitoring/logging

### Deploy to Hosting
```bash
# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

### Post-Deployment Verification
- [ ] Chat widget loads on production site
- [ ] User can authenticate
- [ ] Messages send/receive correctly
- [ ] Bot responses work
- [ ] Admin panel accessible
- [ ] No console errors
- [ ] Mobile responsive

---

## 🔧 Optional: Cloud Functions (Blaze Plan)

### Only if upgrading to Blaze plan:

```bash
cd functions
npm install
firebase deploy --only functions
```

**Benefits:**
- Server-side rate limiting
- Server-side profanity filtering
- Audit logging
- Chat analytics
- Automated cleanup

---

## 📊 Monitoring

### What to Monitor
- [ ] Firestore read/write counts (stay within Spark limits)
- [ ] User engagement (messages per day)
- [ ] Bot match rate (successful vs fallback responses)
- [ ] Admin response time
- [ ] Error rates in browser console

### Firebase Console Checks
- **Usage Tab**: Monitor Firestore operations
- **Rules Tab**: Check for rule violations
- **Indexes Tab**: Verify all indexes built
- **Authentication Tab**: Monitor active users

---

## 🐛 Common Issues & Fixes

### Issue: Bot not responding
**Fix:** 
- Verify FAQs exist in Firestore `faqs` collection
- Check console for errors
- Lower matching threshold in `useChat.ts`

### Issue: Messages not appearing
**Fix:**
- Check Firestore rules deployed correctly
- Verify indexes created and built
- Check user is authenticated

### Issue: Admin panel empty
**Fix:**
- Ensure `users/{uid}.isAdmin == true`
- Wait for indexes to build (5 mins)
- Refresh page

### Issue: Rate limit not working
**Fix:**
- Check `chatHelpers.ts` implementation
- Clear browser cache/storage
- Deploy Cloud Functions for server-side enforcement

---

## 📝 Configuration Summary

### Files Created/Modified
- ✅ `src/components/ChatWidget.tsx` - Main chat interface
- ✅ `src/components/ChatList.tsx` - Chat history
- ✅ `src/components/Admin/ChatsPanel.tsx` - Admin panel
- ✅ `src/hooks/useChat.ts` - Chat logic hook
- ✅ `src/utils/matchKb.ts` - KB matching algorithm
- ✅ `src/utils/chatHelpers.ts` - Rate limit & profanity
- ✅ `kb/seed.json` - 12 FAQs seed data
- ✅ `scripts/seedKb.js` - Seeding script
- ✅ `firestore.rules` - Security rules
- ✅ `firestore.indexes.json` - Index definitions
- ✅ `functions/index.js` - Optional Cloud Functions
- ✅ `src/utils/__tests__/matchKb.test.ts` - Unit tests
- ✅ `jest.config.js` - Test configuration

### Environment Variables Required
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 🎯 Success Criteria

Your chat feature is successfully deployed when:

✅ Users can open chat widget and send messages  
✅ Bot responds with relevant KB answers  
✅ Admin can view all chats and take over  
✅ Real-time updates work bidirectionally  
✅ Rate limiting prevents spam  
✅ Profanity filter works  
✅ Chat history persists across sessions  
✅ No errors in browser console  
✅ Works on Spark plan (no external APIs)  

---

## 📚 Documentation

- **Full Guide**: See `WASILAH_CHAT_README.md`
- **API Docs**: Firebase Firestore, Firebase Auth
- **Support**: Check README troubleshooting section

---

## 🔄 Next Steps After Deployment

1. **Monitor Usage**: Watch Firestore quota in Firebase Console
2. **Gather Feedback**: Ask users about bot accuracy
3. **Improve KB**: Add more FAQs based on common questions
4. **Optimize Matching**: Adjust threshold based on results
5. **Consider Blaze**: If traffic grows, upgrade for Cloud Functions

---

**Deployment Time Estimate**: 30-45 minutes (first time)

**Questions?** Check `WASILAH_CHAT_README.md` for detailed guide.

---

✨ **Ready to deploy? Start with step 1!** ✨
