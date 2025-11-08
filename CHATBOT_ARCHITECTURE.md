# 🏗️ Intelligent Chatbot Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE SPARK PLAN                       │
│                   (100% Free Tier)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                    ┌─────────▼────────┐              ┌────────▼─────────┐
                    │   FIRESTORE DB   │              │  CLOUD FUNCTIONS │
                    │                  │              │                  │
                    │  /kb/pages       │◄─────────────┤  updateKb.js     │
                    │  /chats          │              │                  │
                    │  /unanswered     │              │  • Auto-scraper  │
                    └────────┬─────────┘              │  • Manual refresh│
                             │                        │  • Scheduled job │
                             │                        └──────────────────┘
                             │
                ┌────────────┴───────────────┐
                │                            │
       ┌────────▼────────┐         ┌────────▼────────┐
       │  ChatBot.jsx    │         │ Admin Panel     │
       │                 │         │                 │
       │  • User UI      │         │  • View queries │
       │  • Send msgs    │         │  • Reply manual │
       │  • Show links   │         │  • Refresh KB   │
       └────────┬────────┘         └─────────────────┘
                │
                │
       ┌────────▼────────┐
       │  kbMatcher.js   │
       │                 │
       │  • TF-IDF       │
       │  • Fuzzy match  │
       │  • Synonyms     │
       │  • Extract      │
       └─────────────────┘
```

---

## Data Flow

### User Query Flow

```
1. User types question
   ↓
2. Save to Firestore: /chats/{chatId}/messages
   ↓
3. Load KB pages from Firestore: /kb/pages/content
   ↓
4. kbMatcher.js processes:
   - Tokenize query
   - Calculate TF-IDF scores
   - Compute cosine similarity
   - Apply fuzzy matching
   - Rank results
   ↓
5. If match found (confidence > threshold):
   - Extract relevant snippet
   - Add source URL
   - Save bot response
   ↓
6. If NO match (confidence < threshold):
   - Send fallback message
   - Flag as unanswered query
   - Show "Notify Admin" button
   ↓
7. User sees response in real-time
```

### Admin Reply Flow

```
1. Admin views unanswered queries
   ↓
2. Selects query to answer
   ↓
3. Types manual response
   ↓
4. Save to Firestore: /chats/{chatId}/messages (sender: 'admin')
   ↓
5. Mark query as resolved
   ↓
6. User sees admin response in chat (real-time)
```

### KB Auto-Refresh Flow

```
1. Trigger (weekly schedule OR manual button)
   ↓
2. Cloud Function: updateKb.js executes
   ↓
3. For each page in PAGES_TO_SCRAPE:
   - Fetch HTML from Firebase Hosting
   - Extract text content (remove tags)
   - Tokenize (remove stop words)
   - Store in Firestore: /kb/pages/content/{pageId}
   ↓
4. ChatBot automatically uses updated content
```

---

## Components Breakdown

### Frontend Components

**ChatBot.jsx**
- **Purpose:** Main chatbot UI
- **Features:**
  - Bubble interface
  - Message history
  - Typing animation
  - Source links
  - "Notify Admin" button
  - Suggested questions
- **Dependencies:**
  - Firebase Firestore (messages)
  - Firebase Auth (user identity)
  - kbMatcher.js (intelligence)

**UnansweredQueriesPanel.jsx**
- **Purpose:** Admin dashboard
- **Features:**
  - List pending queries
  - Reply interface
  - KB refresh button
  - Statistics
- **Dependencies:**
  - Firebase Firestore (queries)
  - Firebase Functions (KB refresh)

### Backend Logic

**kbMatcher.js**
- **Purpose:** Intelligence engine
- **Algorithms:**
  1. **Tokenization:** Split text into meaningful words
  2. **TF-IDF:** Calculate term importance
  3. **Cosine Similarity:** Compare query vs documents
  4. **Levenshtein Distance:** Handle typos
  5. **Fuzzy Matching:** Flexible word matching
  6. **Synonym Expansion:** Understand alternatives
- **Output:** Best matching page with confidence score

**updateKb.js (Cloud Function)**
- **Purpose:** Auto-learning system
- **Methods:**
  1. **refreshKnowledgeBase** (callable)
     - Triggered by admin button
     - Returns detailed results
  2. **scheduledKbUpdate** (scheduled)
     - Runs every Sunday 2 AM
     - Logs to system collection
  3. **updateKbHttp** (HTTP endpoint)
     - Alternative trigger method
     - Token-based auth

---

## Matching Algorithm Details

### TF-IDF (Term Frequency - Inverse Document Frequency)

**Purpose:** Identify important words in documents

**Formula:**
```
TF(term, doc) = count(term in doc) / total words in doc
IDF(term) = log(total docs / docs containing term)
TF-IDF = TF × IDF
```

**Example:**
```
Query: "volunteer opportunities"
Document 1: "We have volunteer programs..." (TF-IDF: 0.85)
Document 2: "Our mission is to help..." (TF-IDF: 0.12)
→ Match Document 1
```

### Cosine Similarity

**Purpose:** Measure similarity between query and documents

**Formula:**
```
similarity = (A · B) / (||A|| × ||B||)
Where A = query vector, B = document vector
```

**Range:** 0 (completely different) to 1 (identical)

### Fuzzy Matching with Levenshtein

**Purpose:** Handle typos and misspellings

**Example:**
```
Query: "volunter" (typo)
Document word: "volunteer"
Levenshtein distance: 1 (one character difference)
Similarity: 1 - (1/9) = 0.89 ✓ Match!
```

**Threshold:** 0.75 (75% similarity required)

---

## Firestore Security

### Knowledge Base
```javascript
match /kb/{document=**} {
  allow read: if true;           // Public read
  allow write: if isAdmin();     // Admin only write
}
```
- Anyone can read KB (for chatbot)
- Only admins can update KB

### Chats
```javascript
match /chats/{chatId} {
  allow read, write: if isAuthenticated();  // Logged in users
  allow create: if true;                     // Guests can create
}
```
- Users read/write their own chats
- Guests can create (with session ID)

### Unanswered Queries
```javascript
match /unanswered_queries/{queryId} {
  allow read: if isAdmin();      // Admin only read
  allow write: if true;          // Bot can create
}
```
- Only admins see unanswered queries
- Bot auto-creates when no match

---

## Performance Optimization

### Query Optimization
1. **Limit tokens:** Max 500 per document
2. **Limit content:** Max 5000 chars per document
3. **Index properly:** createdAt fields indexed
4. **Batch reads:** Load all KB pages once

### Function Optimization
1. **Timeout:** Max 60 seconds per execution
2. **Memory:** 256MB default (adjust if needed)
3. **Parallel scraping:** Uses async/await
4. **Error handling:** Doesn't fail entire batch

### Frontend Optimization
1. **Lazy loading:** ChatBot only renders when open
2. **Real-time:** Firestore listeners for instant updates
3. **Caching:** KB pages cached in component state
4. **Debouncing:** Prevent rapid message sending

---

## Spark Plan Limits

### What We Use
- **Firestore Reads:** ~3 per message
- **Firestore Writes:** ~2 per message
- **Function Invocations:** 1 per KB refresh
- **Function Duration:** ~5 seconds per refresh
- **Storage:** ~1MB for KB data

### Spark Limits
- **Reads:** 50,000/day ✅
- **Writes:** 20,000/day ✅
- **Functions:** 125,000 invocations/month ✅
- **Duration:** 40,000 seconds/month ✅
- **Storage:** 1GB ✅

### Capacity
With Spark Plan limits:
- ~16,000 messages/day possible
- ~2,500 KB refreshes/month possible
- ~8,000 refresh seconds/month available

**Verdict:** Extremely generous for small-medium sites

---

## Scalability Path

### Current (Spark Plan)
- 100-1000 messages/day
- 6 pages in KB
- Weekly auto-refresh
- Single-region hosting

### When to Upgrade (Blaze Plan)
- 1000+ messages/day
- 20+ pages in KB
- Daily auto-refresh
- Multi-region hosting
- Advanced analytics

### Migration Path
1. Monitor Firebase Console usage
2. Watch for 50% quota warnings
3. Upgrade to Blaze ($0.06 per 100K reads)
4. Enable more frequent KB updates
5. Add larger KB (more pages)

---

## Error Handling

### Frontend Errors
```javascript
try {
  await sendMessage();
} catch (error) {
  // Show user-friendly error
  // Log to console
  // Don't break UI
}
```

### Function Errors
```javascript
try {
  await scrapePage(url);
} catch (error) {
  // Log error
  // Continue with other pages
  // Return partial results
}
```

### Firestore Errors
```javascript
if (!snapshot.exists()) {
  // Handle missing data gracefully
  // Use fallback values
  // Don't crash
}
```

---

## Testing Strategy

### Unit Tests
- `kbMatcher.js` functions
- Tokenization logic
- Similarity calculations
- Snippet extraction

### Integration Tests
- ChatBot component
- Message sending/receiving
- KB loading
- Admin replies

### End-to-End Tests
1. User sends query
2. Bot responds correctly
3. Source link works
4. Admin receives notification
5. Admin replies
6. User sees reply

---

## Monitoring

### What to Monitor
1. **Message Volume:** How many/day?
2. **Match Rate:** % of successful matches
3. **Unanswered Queries:** How many fallbacks?
4. **Response Time:** How fast?
5. **Error Rate:** Any failures?

### Tools
- Firebase Console → Usage tab
- Browser Console → Errors
- Function Logs → Execution details
- Firestore Console → Data inspection

---

## Future Enhancements

### Short Term (No Code Changes)
- Add more pages to KB
- Improve content quality
- Add more synonyms
- Fine-tune threshold

### Medium Term (Minor Changes)
- Add sentiment analysis
- Track user satisfaction
- A/B test responses
- Add rich media (images/videos)

### Long Term (Major Changes)
- Multi-language support
- Voice input/output
- Integration with other tools
- ML-based ranking (if upgrade to Blaze)

---

## Security Considerations

### Data Privacy
- ✅ Guest chats don't require login
- ✅ User IDs hashed
- ✅ No personal data stored
- ✅ Firestore rules enforced

### API Security
- ✅ No external API keys needed
- ✅ Function auth via Firebase
- ✅ Rate limiting on client
- ✅ Input sanitization

### Admin Access
- ✅ Role-based (isAdmin field)
- ✅ Firestore rules protect admin routes
- ✅ Actions logged
- ✅ No direct database access needed

---

## Maintenance

### Daily
- ✅ Automatic (scheduled KB refresh)

### Weekly
- Check unanswered queries
- Review match accuracy
- Update content if needed

### Monthly
- Review usage metrics
- Add new KB pages
- Update synonyms
- Check function logs

### Quarterly
- Analyze trends
- Major content updates
- Feature additions
- Performance tuning

---

**Built for Firebase Spark Plan**
**Zero external dependencies • 100% free to run**
