# 🚀 Chatbot Quick Start (5 Minutes)

## TL;DR

```bash
# 1. Install
npm install
cd functions && npm install && cd ..

# 2. Seed KB
node scripts/seedInitialKb.js

# 3. Deploy rules
firebase deploy --only firestore:rules,firestore:indexes

# 4. Add to app (App.tsx)
import ChatBot from './components/ChatBot';
// Add <ChatBot /> in your JSX

# 5. Test
npm run dev
```

---

## What You Get

✅ **Smart chatbot** that understands your website  
✅ **No external APIs** - 100% Firebase  
✅ **Source links** in every answer  
✅ **Admin panel** for manual replies  
✅ **Auto-learning** from your site (weekly)  
✅ **Free tier** compatible  

---

## How It Works

1. **User asks question** → "How can I volunteer?"
2. **Bot searches KB** using TF-IDF + fuzzy matching
3. **Returns best match** with source link
4. **If no match** → "Notify Admin" button appears
5. **Admin replies** → User sees it in chat

---

## File Structure

```
/src
  /components
    ChatBot.jsx ← Main UI
    /Admin
      UnansweredQueriesPanel.jsx ← Admin interface
  /utils
    kbMatcher.js ← Intelligence engine

/functions
  updateKb.js ← Auto-scraper
  package.json

/scripts
  seedInitialKb.js ← Initial setup

firestore.rules ← Security
firestore.indexes.json ← Performance
firebase.json ← Config
```

---

## Testing

### Test Questions:
- "What is Wasilah?"
- "How can I volunteer?"
- "What projects do you run?"
- "Where are you located?"

### Expected Results:
- ✅ Gets relevant answer
- ✅ Shows source link
- ✅ Under 1 second response
- ✅ No console errors

---

## Admin Setup

1. Make user admin:
```javascript
// Firestore Console → users → {userId}
{ isAdmin: true }
```

2. Add route:
```jsx
<Route 
  path="/admin/chatbot" 
  element={<UnansweredQueriesPanel />} 
/>
```

3. Visit `/admin/chatbot`

---

## Customization

### Change confidence threshold:
```javascript
// ChatBot.jsx line ~144
const match = findBestMatch(userMessage, kbPages, 0.4);
// 0.3 = more lenient, 0.6 = more strict
```

### Add pages to scrape:
```javascript
// functions/updateKb.js
const PAGES_TO_SCRAPE = [
  { url: '/', title: 'Home' },
  { url: '/your-page', title: 'Your Page' },
];
```

### Add synonyms:
```javascript
// utils/kbMatcher.js
const SYNONYMS = {
  'help': ['assist', 'support'],
  'yourword': ['synonym1', 'synonym2'],
};
```

---

## Deploy to Production

```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only firestore  # Rules & indexes
firebase deploy --only functions   # KB auto-updater
firebase deploy --only hosting     # Website
```

---

## Troubleshooting

**Chat button not showing?**
→ Check if `<ChatBot />` is in App.tsx

**No responses?**
→ Run `node scripts/seedInitialKb.js` again

**"Function not found"?**
→ Deploy functions: `firebase deploy --only functions`

**Always says "I don't know"?**
→ Lower threshold to 0.3 in ChatBot.jsx

---

## Cost (Spark Plan)

- 100 messages/day = ~300 reads, ~200 writes
- Weekly KB refresh = ~5 seconds function time
- **Total: Well within Spark limits** ✅

---

## Next Steps

1. ✅ Test basic functionality
2. ✅ Add admin user
3. ✅ Deploy functions for auto-refresh
4. ✅ Monitor unanswered queries
5. ✅ Improve KB based on questions

---

**Full guide:** See `CHATBOT_DEPLOYMENT_GUIDE.md`

**Questions?** Check browser console or function logs
