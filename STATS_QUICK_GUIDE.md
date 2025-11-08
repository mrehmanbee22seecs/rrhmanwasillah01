# 📊 Stats System - Quick Reference Guide

## How Stats Work (Simple Version)

### **All stats start at ZERO** ⚡

Every user begins with:
```
Projects Joined: 0
Events Attended: 0
Hours Volunteered: 0
Impact Score: 0
```

---

## How to Increment Stats

### **1. Projects Joined** 🎯

**User creates or joins a project:**
1. User submits project via "Create Submission"
2. Sets duration hours (e.g., 40 hours)
3. **Admin approves** → Stats increment!

**Result:**
- ✅ Projects: +1
- ✅ Hours: +40
- ✅ Impact: +30

---

### **2. Events Attended** 📅

**User creates or attends an event:**
1. User submits event via "Create Submission"
2. Sets duration hours (e.g., 3 hours)
3. **Admin approves** → Stats increment!

**Result:**
- ✅ Events: +1
- ✅ Hours: +3
- ✅ Impact: +6

---

### **3. Hours Volunteered** ⏰

**Automatically calculated from:**
- Sum of hours from ALL completed projects + events
- Uses `durationHours` field from each submission
- Real hours, not estimates!

---

### **4. Impact Score** 🏆

**Formula:**
```
Impact = (Projects × 10) + (Events × 5) + (Hours ÷ 2)
```

**Example:**
```
User has: 3 projects, 5 events, 50 hours
Impact = (3 × 10) + (5 × 5) + (50 ÷ 2)
       = 30 + 25 + 25
       = 80 points
```

---

## Required Fields in Submission Form

### **When creating a Project/Event:**

1. **Duration Estimate** (text)
   - Example: "3 hours", "Full day", "2 weeks"

2. **Duration (Hours)** (number) ⭐ **IMPORTANT**
   - Example: `3`, `8`, `40`
   - This is what counts toward stats!

3. **Submit** → Status: `pending`
4. **Admin approves** → Status: `approved`
5. **Stats update automatically!** ✅

---

## Stats Update Flow

```
User creates project (10 hours)
         ↓
Status: pending → Stats: 0
         ↓
Admin approves
         ↓
Status: approved → Stats update!
         ↓
Projects: +1, Hours: +10, Impact: +15
```

---

## Important Notes

### ✅ **DO's:**
- ✅ Always fill in "Duration (Hours)" field
- ✅ Approve submissions to count them
- ✅ Use realistic hour estimates
- ✅ Add users to participantIds/attendeeIds

### ❌ **DON'Ts:**
- ❌ Don't leave durationHours empty
- ❌ Stats don't count drafts or pending items
- ❌ Stats don't increment until approved
- ❌ Don't use unrealistic hours

---

## Testing Stats

### **Test 1: New User**
```bash
1. Login as new user
2. Check Dashboard → All stats should be 0
3. Create project (5 hours)
4. Admin approves
5. Refresh Dashboard → Projects: 1, Hours: 5, Impact: 7
```

### **Test 2: Multiple Activities**
```bash
1. Create event (3 hours) → Approve
2. Stats: Events: 1, Hours: 3, Impact: 6
3. Create project (10 hours) → Approve
4. Stats: Projects: 1, Events: 1, Hours: 13, Impact: 21
```

---

## Admin Actions

### **To track user participation:**

**For Projects:**
```javascript
// User joins existing project
// Admin updates Firestore:
participantIds: [userId1, userId2, userId3]
```

**For Events:**
```javascript
// User attends event
// Admin updates Firestore:
attendeeIds: [userId1, userId2, userId3]
```

---

## Quick Reference Table

| Action | Projects | Events | Hours | Impact |
|--------|----------|--------|-------|--------|
| Create 5hr project (approved) | +1 | 0 | +5 | +12 |
| Create 3hr event (approved) | 0 | +1 | +3 | +6 |
| Join 20hr project (approved) | +1 | 0 | +20 | +20 |
| Attend 2hr event (approved) | 0 | +1 | +2 | +6 |

---

## Summary

**Key Points:**
1. Stats start at zero
2. Only approved/completed items count
3. Hours are REAL, not random
4. Impact score has a formula
5. Updates happen automatically in real-time

**That's it!** Simple, accurate, and fair. 🎉

