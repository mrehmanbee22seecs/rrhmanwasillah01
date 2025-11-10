/**
 * Enhanced Firebase Functions for Wasillah Email Automation
 * 
 * These functions integrate with Resend for email delivery and handle:
 * 1. Submission confirmations (projects/events)
 * 2. Admin approval notifications
 * 3. Reminder scheduling and sending
 * 4. Volunteer confirmations
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { Timestamp } = admin.firestore;

// Initialize Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_TWHg3zaz_7KQnXVULcpgG57GtJxohNxve';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Sender email configuration
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = 'Wasillah Team';

// Brand styling constants
const brand = {
  gradient: 'linear-gradient(135deg, #FF6B9D, #00D9FF)',
  headerBg: '#0F0F23',
  accent: '#FF6B9D',
  textDark: '#2C3E50',
  textLight: '#ffffff'
};

/**
 * Helper function to send email via Resend
 */
async function sendEmailViaResend(emailData) {
  if (!resend) {
    console.log('Resend not configured; skipping email send');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }

    console.log('Email sent via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    return false;
  }
}

/**
 * Trigger: onCreate for project_submissions
 * Sends confirmation email to submitter
 */
exports.onProjectSubmissionCreate = functions.firestore
  .document('project_submissions/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const submitterEmail = data.submitterEmail || data.email;
    const submitterName = data.submitterName || data.name || 'User';
    const title = data.title || 'Untitled Project';

    if (!submitterEmail) {
      console.log('No submitter email found');
      return null;
    }

    // Send confirmation email
    const emailHtml = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
        <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
          <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">Project Submitted</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px 24px;">
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            Hi <strong>${submitterName}</strong>,
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            Your project submission "<strong>${title}</strong>" has been received and is under review.
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            You'll be notified once it's approved.
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            — The Wasillah Team
          </p>
        </div>
        
        <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">We'll review your submission and get back to you soon.</p>
        </div>
      </div>
    `;

    await sendEmailViaResend({
      to: submitterEmail,
      subject: `Project Submission Received: ${title}`,
      html: emailHtml
    });

    return null;
  });

/**
 * Trigger: onCreate for event_submissions
 * Sends confirmation email to submitter
 */
exports.onEventSubmissionCreate = functions.firestore
  .document('event_submissions/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const submitterEmail = data.submitterEmail || data.email;
    const submitterName = data.submitterName || data.name || 'User';
    const title = data.title || 'Untitled Event';

    if (!submitterEmail) {
      console.log('No submitter email found');
      return null;
    }

    // Send confirmation email
    const emailHtml = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
        <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
          <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">Event Submitted</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px 24px;">
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            Hi <strong>${submitterName}</strong>,
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            Your event submission "<strong>${title}</strong>" has been received and is under review.
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            You'll be notified once it's approved.
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            — The Wasillah Team
          </p>
        </div>
        
        <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">We'll review your submission and get back to you soon.</p>
        </div>
      </div>
    `;

    await sendEmailViaResend({
      to: submitterEmail,
      subject: `Event Submission Received: ${title}`,
      html: emailHtml
    });

    return null;
  });

/**
 * Trigger: onUpdate for project_submissions
 * Sends approval/rejection email when status changes
 */
exports.onProjectStatusChange = functions.firestore
  .document('project_submissions/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed to approved
    if (before.status !== 'approved' && after.status === 'approved') {
      const submitterEmail = after.submitterEmail || after.email;
      const submitterName = after.submitterName || after.name || 'User';
      const title = after.title || 'Untitled Project';

      if (!submitterEmail) {
        console.log('No submitter email found');
        return null;
      }

      // Send approval email
      const emailHtml = `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 30px 20px; text-align: center;">
            <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">🎉 Project Approved!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px 24px;">
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
              Hi <strong>${submitterName}</strong>,
            </p>
            
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
              Great news! Your project "<strong>${title}</strong>" has been approved.
            </p>
            
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
              Thank you for contributing to Wasillah. Your project is now live and visible to the community!
            </p>
            
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
              — The Wasillah Team
            </p>
          </div>
          
          <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Keep up the great work!</p>
          </div>
        </div>
      `;

      await sendEmailViaResend({
        to: submitterEmail,
        subject: `Great News! Your project "${title}" has been approved`,
        html: emailHtml
      });
    }

    return null;
  });

/**
 * Trigger: onUpdate for event_submissions
 * Sends approval/rejection email when status changes
 */
exports.onEventStatusChange = functions.firestore
  .document('event_submissions/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed to approved
    if (before.status !== 'approved' && after.status === 'approved') {
      const submitterEmail = after.submitterEmail || after.email;
      const submitterName = after.submitterName || after.name || 'User';
      const title = after.title || 'Untitled Event';

      if (!submitterEmail) {
        console.log('No submitter email found');
        return null;
      }

      // Send approval email
      const emailHtml = `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 30px 20px; text-align: center;">
            <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">🎉 Event Approved!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px 24px;">
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
              Hi <strong>${submitterName}</strong>,
            </p>
            
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
              Great news! Your event "<strong>${title}</strong>" has been approved.
            </p>
            
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
              Thank you for contributing to Wasillah. Your event is now live and visible to the community!
            </p>
            
            <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
              — The Wasillah Team
            </p>
          </div>
          
          <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Keep up the great work!</p>
          </div>
        </div>
      `;

      await sendEmailViaResend({
        to: submitterEmail,
        subject: `Great News! Your event "${title}" has been approved`,
        html: emailHtml
      });
    }

    return null;
  });

/**
 * SPARK PLAN COMPATIBLE: Trigger-based reminder checker
 * Fires when a reminder document is updated with checkSchedule field
 * This allows the frontend to trigger checks without requiring scheduled functions
 */
exports.checkDueReminders = functions.https.onCall(async (data, context) => {
  // This function can be called by the frontend periodically or on user action
  const now = Timestamp.now();

  try {
    const snapshot = await db.collection('reminders')
      .where('sent', '==', false)
      .get();

    const batch = db.batch();
    let sentCount = 0;

    for (const docSnap of snapshot.docs) {
      const reminder = docSnap.data();
      
      // Parse scheduledAt (could be string or Timestamp)
      let scheduledTime;
      if (typeof reminder.scheduledAt === 'string') {
        scheduledTime = Timestamp.fromDate(new Date(reminder.scheduledAt));
      } else {
        scheduledTime = reminder.scheduledAt;
      }

      // Check if it's time to send (scheduled time has passed)
      if (scheduledTime && scheduledTime.toMillis() <= now.toMillis()) {
        
        // Send reminder email
        const emailHtml = `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
            <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
              <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">⏰ Reminder</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px 24px;">
              <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
                Hi <strong>${reminder.name}</strong>,
              </p>
              
              <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
                This is your reminder for <strong>${reminder.projectName}</strong>:
              </p>
              
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #78350F; font-size: 15px; line-height: 1.6;">
                  ${reminder.message}
                </p>
              </div>
              
              <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                — Wasillah Team
              </p>
            </div>
            
            <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">This is an automated reminder you set up.</p>
            </div>
          </div>
        `;

        const success = await sendEmailViaResend({
          to: reminder.email,
          subject: `Reminder: ${reminder.projectName}`,
          html: emailHtml
        });

        if (success) {
          batch.update(docSnap.ref, { 
            sent: true, 
            sentAt: Timestamp.now() 
          });
          sentCount++;
        }
      }
    }

    if (sentCount > 0) {
      await batch.commit();
      console.log(`Sent ${sentCount} reminder emails`);
    }

    return { success: true, sentCount };
  } catch (error) {
    console.error('Error checking reminders:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check reminders');
  }
});

/**
 * HTTP Callable Function: Send a reminder immediately (for testing)
 */
exports.sendReminderNow = functions.https.onCall(async (data, context) => {
  const { reminderId } = data;

  if (!reminderId) {
    throw new functions.https.HttpsError('invalid-argument', 'reminderId is required');
  }

  try {
    const reminderRef = db.collection('reminders').doc(reminderId);
    const reminderSnap = await reminderRef.get();

    if (!reminderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Reminder not found');
    }

    const reminder = reminderSnap.data();

    if (reminder.sent) {
      return { success: false, message: 'Reminder already sent' };
    }

    // Send reminder email
    const emailHtml = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
        <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
          <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">⏰ Reminder</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px 24px;">
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            Hi <strong>${reminder.name}</strong>,
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            This is your reminder for <strong>${reminder.projectName}</strong>:
          </p>
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0; color: #78350F; font-size: 15px; line-height: 1.6;">
              ${reminder.message}
            </p>
          </div>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            — Wasillah Team
          </p>
        </div>
        
        <div style="background: ${brand.headerBg}; color: ${brand.textLight}; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">This is an automated reminder you set up.</p>
        </div>
      </div>
    `;

    const success = await sendEmailViaResend({
      to: reminder.email,
      subject: `Reminder: ${reminder.projectName}`,
      html: emailHtml
    });

    if (success) {
      await reminderRef.update({ 
        sent: true, 
        sentAt: Timestamp.now() 
      });
      return { success: true, message: 'Reminder sent successfully' };
    } else {
      return { success: false, message: 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error in sendReminderNow:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send reminder');
  }
});

module.exports = exports;
