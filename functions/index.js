/**
 * OPTIONAL CLOUD FUNCTIONS FOR BLAZE PLAN
 * 
 * These functions are OPTIONAL and require upgrading to Firebase Blaze plan.
 * The chat feature works fully on Spark plan without these functions.
 * 
 * To deploy: 
 * 1. Upgrade to Blaze plan
 * 2. Run: firebase deploy --only functions
 * 
 * Benefits when deployed:
 * - Server-side rate limiting (more secure)
 * - Server-side profanity filtering
 * - Audit logging for admin actions
 * - Better security against client-side manipulation
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const { Timestamp } = admin.firestore;

// Simple mail sender via 3rd-party API placeholder (HTTP webhook)
// Replace MAIL_WEBHOOK_URL with your transactional email provider endpoint
const axios = require('axios');
const MAIL_WEBHOOK_URL = process.env.MAIL_WEBHOOK_URL || '';

async function sendMail(emailData) {
  if (!MAIL_WEBHOOK_URL) {
    console.log('MAIL_WEBHOOK_URL not set; skipping actual email send. Data:', emailData.subject);
    return;
  }
  try {
    await axios.post(MAIL_WEBHOOK_URL, emailData, { timeout: 10000 });
  } catch (e) {
    console.error('Email send failed', e?.response?.data || e.message);
  }
}

// Server-side rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5;

/**
 * Trigger: onCreate for messages
 * Validates rate limits and filters profanity on the server side
 */
exports.onMessageCreate = functions.firestore
  .document('users/{userId}/chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { userId, chatId, messageId } = context.params;
    const message = snap.data();

    // Only apply to user messages
    if (message.sender !== 'user') {
      return null;
    }

    try {
      // Server-side rate limit check
      const recentMessages = await db
        .collection(`users/${userId}/chats/${chatId}/messages`)
        .where('sender', '==', 'user')
        .where('createdAt', '>', new Date(Date.now() - RATE_LIMIT_WINDOW))
        .get();

      if (recentMessages.size > RATE_LIMIT_MAX) {
        console.warn(`Rate limit exceeded for user ${userId}`);
        // Delete the message that exceeded rate limit
        await snap.ref.delete();
        return null;
      }

      // Server-side profanity filter (more comprehensive list)
      const profanityWords = [
        'damn', 'hell', 'crap', 'stupid', 'idiot', 'dumb',
        // Add more as needed
      ];

      let filteredText = message.text;
      for (const word of profanityWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, (match) => '*'.repeat(match.length));
      }

      // Update message if profanity was found
      if (filteredText !== message.text) {
        await snap.ref.update({ text: filteredText });
      }

      return null;
    } catch (error) {
      console.error('Error in onMessageCreate:', error);
      return null;
    }
  });

/**
 * Trigger: onCreate for bot messages with KB matching
 * Alternative server-side bot response (more secure)
 */
exports.generateBotResponse = functions.firestore
  .document('users/{userId}/chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { userId, chatId } = context.params;
    const message = snap.data();

    // Only respond to user messages
    if (message.sender !== 'user') {
      return null;
    }

    try {
      // Check if chat has takeover
      const chatDoc = await db.doc(`users/${userId}/chats/${chatId}`).get();
      const chatData = chatDoc.data();

      if (chatData?.takeoverBy) {
        // Admin has taken over, skip bot response
        return null;
      }

      // Skip legacy bot if client uses external AI provider
      if (chatData?.aiProvider) {
        console.log(`AI provider set to ${chatData.aiProvider}; skipping legacy bot response`);
        return null;
      }

      // Get recent messages for context
      const recentMessages = await db
        .collection(`users/${userId}/chats/${chatId}/messages`)
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get();

      const context = recentMessages.docs
        .map(doc => doc.data().text)
        .reverse()
        .join(' ');

      // Load KB
      const kbSnapshot = await db.collection('faqs').get();
      const faqs = kbSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Simple keyword matching (you can import matchKb logic here)
      const query = `${context} ${message.text}`.toLowerCase();
      let bestMatch = null;
      let bestScore = 0;

      for (const faq of faqs) {
        let score = 0;
        for (const keyword of faq.keywords || []) {
          if (query.includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
        if (score > bestScore && score > 0) {
          bestScore = score;
          bestMatch = faq;
        }
      }

      // Generate response
      let botResponse;
      let meta = {};

      if (bestMatch && bestScore >= 2) {
        botResponse = bestMatch.answer;
        if (botResponse.length > 500) {
          botResponse = botResponse.substring(0, 500) + '...\n\n[Read more in our FAQ section]';
        }
        meta = { faqId: bestMatch.id };
      } else {
        botResponse = "I'm sorry — we don't have that information right now. We'll review your question and an admin will reach out to you soon.";
      }

      // Add bot message
      await db.collection(`users/${userId}/chats/${chatId}/messages`).add({
        sender: 'bot',
        text: botResponse,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        meta
      });

      // Update chat activity
      await db.doc(`users/${userId}/chats/${chatId}`).update({
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('Error generating bot response:', error);
      return null;
    }
  });

/**
 * Submission created: send confirmation to submitter and notification to admin.
 */
exports.onSubmissionCreate = functions.firestore
  .document('{collectionId}/{docId}')
  .onCreate(async (snap, context) => {
    const { collectionId } = context.params;
    if (collectionId !== 'project_submissions' && collectionId !== 'event_submissions') return null;
    const data = snap.data();
    try {
      // Admin notification
      await db.collection('admin_notifications').add({
        type: 'submission_created',
        collection: collectionId,
        title: data.title,
        submitterEmail: data.submitterEmail,
        createdAt: Timestamp.now()
      });
    } catch (e) {
      console.error('Failed to write admin notification', e);
    }
    // Optionally send email via webhook (payload mirrors emailService.EmailData)
    const submitterEmail = data.submitterEmail;
    if (submitterEmail) {
      const subject = `${collectionId === 'project_submissions' ? 'Project' : 'Event'} submitted successfully: ${data.title}`;
      const html = `<div style="font-family:Inter,Arial,sans-serif"><h2>Thank you for your submission</h2><p>We received your ${collectionId === 'project_submissions' ? 'project' : 'event'}: <strong>${data.title}</strong>.</p></div>`;
      await sendMail({ to: submitterEmail, subject, html });
    }
    return null;
  });

/**
 * Registration/applications stored in subcollections 'applications' or 'registrations'.
 * Send a confirmation to the user on create.
 */
exports.onApplicationCreate = functions.firestore
  .document('{parentCollection}/{parentId}/{subCollection}/{id}')
  .onCreate(async (snap, context) => {
    const { parentCollection, subCollection } = context.params;
    const validParent = parentCollection === 'project_submissions' || parentCollection === 'event_submissions';
    const validSub = subCollection === 'applications' || subCollection === 'registrations';
    if (!validParent || !validSub) return null;
    const data = snap.data();
    const title = (await db.doc(`${parentCollection}/${context.params.parentId}`).get()).data()?.title || '';
    const to = data.email || data.submitterEmail;
    if (!to) return null;
    const subject = `${parentCollection === 'project_submissions' ? 'Application' : 'Registration'} received: ${title}`;
    const html = `<div style="font-family:Inter,Arial,sans-serif"><h2>We received your ${parentCollection === 'project_submissions' ? 'application' : 'registration'}</h2><p>Title: <strong>${title}</strong></p></div>`;
    await sendMail({ to, subject, html });
    return null;
  });

/**
 * Reminder scheduler: reads from reminders collection and sends emails at exact time.
 * Requires Cloud Scheduler + Pub/Sub (Blaze plan). For emulator/dev, it still runs hourly.
 */
exports.sendDueReminders = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  try {
    const snapshot = await db.collection('reminders')
      .where('sent', '==', false)
      .where('scheduledAt', '>=', fiveMinAgo)
      .where('scheduledAt', '<=', now)
      .get();
    const batch = db.batch();
    for (const docSnap of snapshot.docs) {
      const rem = docSnap.data();
      const to = Array.isArray(rem.notifyEmails) ? rem.notifyEmails : [rem.email].filter(Boolean);
      const subject = `Reminder: ${rem.title}`;
      const html = `<div style="font-family:Inter,Arial,sans-serif"><h2>${rem.title}</h2><p>${rem.description || ''}</p><p>When: ${rem.when || new Date(rem.scheduledAt.toDate?.() || rem.scheduledAt).toLocaleString()}</p></div>`;
      for (const recipient of to) {
        await sendMail({ to: recipient, subject, html });
      }
      batch.update(docSnap.ref, { sent: true, sentAt: Timestamp.now() });
    }
    await batch.commit();
  } catch (e) {
    console.error('sendDueReminders failed', e);
  }
  return null;
});

/**
 * Audit logging for admin actions
 */
exports.logAdminAction = functions.firestore
  .document('users/{userId}/chats/{chatId}')
  .onUpdate(async (change, context) => {
    const { userId, chatId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Check if takeover status changed
    if (before.takeoverBy !== after.takeoverBy) {
      try {
        await db.collection('auditLogs').add({
          action: after.takeoverBy ? 'takeover_enabled' : 'takeover_disabled',
          actorUid: after.takeoverBy || before.takeoverBy,
          payload: {
            userId,
            chatId,
            previousState: before.takeoverBy,
            newState: after.takeoverBy
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error logging admin action:', error);
      }
    }

    return null;
  });

/**
 * Clean up old inactive chats (optional maintenance function)
 * Run manually or on a schedule
 */
exports.cleanupInactiveChats = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const chatsSnapshot = await db
          .collection(`users/${userDoc.id}/chats`)
          .where('isActive', '==', false)
          .where('lastActivityAt', '<', thirtyDaysAgo)
          .get();

        for (const chatDoc of chatsSnapshot.docs) {
          console.log(`Archiving chat ${chatDoc.id} for user ${userDoc.id}`);
          // Instead of deleting, we could move to an archive collection
          // For now, just mark as archived
          await chatDoc.ref.update({ archived: true });
        }
      }

      return null;
    } catch (error) {
      console.error('Error cleaning up chats:', error);
      return null;
    }
  });

/**
 * HTTP function to get chat analytics (admin only)
 */
exports.getChatAnalytics = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated and is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userDoc = await db.doc(`users/${context.auth.uid}`).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User must be admin'
    );
  }

  try {
    const usersSnapshot = await db.collection('users').get();
    let totalChats = 0;
    let totalMessages = 0;
    let activeChats = 0;

    for (const userDoc of usersSnapshot.docs) {
      const chatsSnapshot = await db
        .collection(`users/${userDoc.id}/chats`)
        .get();

      totalChats += chatsSnapshot.size;

      for (const chatDoc of chatsSnapshot.docs) {
        if (chatDoc.data().isActive) {
          activeChats++;
        }

        const messagesSnapshot = await db
          .collection(`users/${userDoc.id}/chats/${chatDoc.id}/messages`)
          .get();

        totalMessages += messagesSnapshot.size;
      }
    }

    return {
      totalUsers: usersSnapshot.size,
      totalChats,
      activeChats,
      totalMessages,
      averageMessagesPerChat: totalChats > 0 ? (totalMessages / totalChats).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch analytics');
  }
});

/**
 * Custom email: Verification and Password Reset (templates via webhook email provider)
 */
exports.sendVerificationEmailCustom = functions.https.onCall(async (data, context) => {
  const email = (data && data.email) || (context.auth && context.auth.token && context.auth.token.email);
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }
  const appUrl = process.env.APP_URL || 'https://wasilah-new.web.app';
  const actionCodeSettings = { url: `${appUrl}/dashboard`, handleCodeInApp: true };
  try {
    const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;background:#0F0F23;color:#fff">
        <div style="background:linear-gradient(135deg,#FF6B9D,#00D9FF);padding:20px;text-align:center">
          <h1 style="margin:0;color:#fff">Verify your email</h1>
        </div>
        <div style="background:#ffffff;padding:24px;color:#0f172a">
          <p>Hello,</p>
          <p>Thanks for joining Wasilah. Please verify your email to finish setting up your account.</p>
          <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Verify Email</a></p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all;color:#334155">${link}</p>
          <p>— Wasilah Team</p>
        </div>
      </div>`;
    await sendMail({ to: email, subject: 'Verify your Wasilah account', html });
    return { ok: true };
  } catch (e) {
    console.error('sendVerificationEmailCustom failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to send verification email');
  }
});

exports.sendPasswordResetEmailCustom = functions.https.onCall(async (data) => {
  const email = data && data.email;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }
  const appUrl = process.env.APP_URL || 'https://wasilah-new.web.app';
  const actionCodeSettings = { url: `${appUrl}/dashboard`, handleCodeInApp: true };
  try {
    const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;background:#0F0F23;color:#fff">
        <div style="background:linear-gradient(135deg,#FF6B9D,#00D9FF);padding:20px;text-align:center">
          <h1 style="margin:0;color:#fff">Reset your password</h1>
        </div>
        <div style="background:#ffffff;padding:24px;color:#0f172a">
          <p>Hello,</p>
          <p>You requested a password reset for your Wasilah account.</p>
          <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all;color:#334155">${link}</p>
          <p>— Wasilah Team</p>
        </div>
      </div>`;
    await sendMail({ to: email, subject: 'Reset your Wasilah password', html });
    return { ok: true };
  } catch (e) {
    console.error('sendPasswordResetEmailCustom failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
  }
});
