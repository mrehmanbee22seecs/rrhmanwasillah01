# Firebase Spark Plan Compatibility

## Overview
All email functions in this project are now compatible with the **Firebase Spark (free) plan**.

## Changes Made for Spark Compatibility

### 1. Removed Scheduled Functions (Blaze Plan Only)
**Before (Required Blaze Plan):**
```javascript
exports.sendDueReminders = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  // Check for due reminders every 5 minutes
});
```

**After (Spark Plan Compatible):**
```javascript
exports.checkDueReminders = functions.https.onCall(async (data, context) => {
  // Callable function that can be triggered by frontend
  // Checks for due reminders on demand
});
```

### 2. Frontend-Triggered Reminder Checking
The reminder checking is now handled in two ways:

1. **Automatic Check**: The RemindersPanel component automatically checks for due reminders every 5 minutes when users are on the dashboard
2. **Manual Check**: Users can manually trigger a check using the "Check for Due Reminders" button

### 3. Email Functions Compatibility

All email functions use only Spark-compatible features:

| Function | Type | Spark Compatible | Description |
|----------|------|------------------|-------------|
| `onProjectSubmissionCreate` | Firestore Trigger | ✅ Yes | Sends email when project is submitted |
| `onEventSubmissionCreate` | Firestore Trigger | ✅ Yes | Sends email when event is submitted |
| `onProjectStatusChange` | Firestore Trigger | ✅ Yes | Sends approval/rejection emails |
| `onEventStatusChange` | Firestore Trigger | ✅ Yes | Sends approval/rejection emails |
| `checkDueReminders` | HTTPS Callable | ✅ Yes | Checks and sends due reminder emails |
| `sendReminderNow` | HTTPS Callable | ✅ Yes | Manually sends a specific reminder |

## Firebase Spark Plan Limits

The Spark plan includes:
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Functions**: 125K invocations/month, 40K GB-seconds compute time
- **Authentication**: Unlimited users
- **Hosting**: 10 GB storage, 360 MB/day transfer

### Email Volume Considerations

With the Resend free tier (100 emails/day) and Firebase Spark plan limits:
- **Functions invocations**: 125K/month ≈ 4,166/day
- **Reminder checks**: If each user checks every 5 minutes while on dashboard, that's 12 checks/hour/user
- **Estimated capacity**: Can support hundreds of active users checking reminders

## Best Practices

### 1. Optimize Reminder Checks
The RemindersPanel only runs automatic checks:
- When the user is actively on the dashboard
- Maximum once every 5 minutes
- Stops when user leaves the dashboard

### 2. Batch Operations
The `checkDueReminders` function:
- Processes all due reminders in a single invocation
- Uses batch writes to minimize Firestore operations
- Returns after processing all reminders

### 3. Efficient Queries
All reminder queries use indexes:
- `where('sent', '==', false)` - Uses the reminders index
- `where('userId', '==', uid)` - Uses the userId index
- Results are cached in the frontend

## Monitoring Usage

### Check Your Firebase Usage
1. Go to Firebase Console → Usage and Billing
2. Monitor:
   - Functions invocations (should stay under 125K/month)
   - Firestore reads/writes
   - Storage usage

### Check Your Resend Usage
1. Go to Resend Dashboard → Usage
2. Monitor daily email sends (limit: 100/day on free tier)

## Upgrading to Blaze Plan (Optional)

If you want to enable scheduled functions (automatic reminder checking without user interaction):

1. Upgrade to Blaze plan (pay-as-you-go)
2. Uncomment the scheduled function code
3. Deploy with:
   ```bash
   firebase deploy --only functions
   ```

Benefits of scheduled functions:
- Automatic reminder checking even when users are offline
- More predictable timing
- No frontend involvement needed

Cost estimate:
- Scheduled function runs every 5 minutes = 8,640 invocations/month
- With other functions, total ≈ 10,000-20,000/month
- Cost: ~$0.01-0.05/month (extremely low)

## Troubleshooting

### "Function not found" Error
If you get this error when checking reminders:
1. Ensure functions are deployed: `firebase deploy --only functions`
2. Check Firebase Console → Functions to verify `checkDueReminders` is listed
3. Verify your Firebase project is on Spark or Blaze plan

### Reminders Not Sending
1. Check the RemindersPanel component is loaded (visit dashboard)
2. Click "Check for Due Reminders" button manually
3. Check browser console for errors
4. Verify Resend API key is configured correctly
5. Check Firebase Functions logs: `firebase functions:log`

### Rate Limits
If you hit rate limits:
1. **Resend**: Upgrade to a paid plan for more emails
2. **Firebase Functions**: Optimize check frequency or upgrade to Blaze
3. **Firestore**: Add caching to reduce reads

## Summary

✅ **All email functions are Spark plan compatible**
✅ **No scheduled functions required**
✅ **Frontend triggers reminder checks**
✅ **Cost: $0/month on Spark plan**
✅ **Works with Resend free tier (100 emails/day)**

The system is designed to work efficiently within free tier limits while providing full functionality!
