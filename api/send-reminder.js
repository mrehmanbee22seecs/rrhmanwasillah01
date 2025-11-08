/**
 * Vercel Serverless Function for QStash Reminder Callback
 * 
 * This endpoint is called by Upstash QStash when it's time to send a reminder.
 * It receives the reminder data, sends an email via MailerSend, and updates Firestore.
 * 
 * CURRENTLY DISABLED - Email features are temporarily disabled
 */

// Email features temporarily disabled
// import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = getFirestore();

// Email features temporarily disabled
// const mailerSend = new MailerSend({
//   apiKey: process.env.MAILERSEND_API_KEY || '',
// });

// const SENDER_EMAIL = process.env.MAILERSEND_SENDER_EMAIL || 'MS_qJLYQi@trial-0r83ql3jjz8lgwpz.mlsender.net';
// const SENDER_NAME = 'Wasillah Team';

// Brand styling for emails
const brand = {
  gradient: 'linear-gradient(135deg, #FF6B9D, #00D9FF)',
  headerBg: '#0F0F23',
  textDark: '#2C3E50',
  textLight: '#ffffff'
};

/**
 * Send email via MailerSend
 * CURRENTLY DISABLED - Email features are temporarily disabled
 */
async function sendEmail(to, subject, html) {
  console.log('Email feature disabled - would have sent to:', to);
  console.log('Subject:', subject);
  return false; // Email features disabled
}

/**
 * Main handler for the serverless function
 * CURRENTLY DISABLED - Email features are temporarily disabled
 */
export default async function handler(req, res) {
  // Email features temporarily disabled
  return res.status(503).json({ 
    error: 'Email features are currently disabled',
    message: 'Reminder functionality is temporarily unavailable'
  });

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reminderId, email, name, projectName, message } = req.body;

    console.log('Processing reminder:', reminderId);

    // Validate required fields
    if (!reminderId || !email || !name || !projectName || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { reminderId, email, name, projectName, message }
      });
    }

    // Get reminder from Firestore
    const reminderRef = db.collection('reminders').doc(reminderId);
    const reminderDoc = await reminderRef.get();

    if (!reminderDoc.exists) {
      console.error('Reminder not found:', reminderId);
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const reminderData = reminderDoc.data();

    // Check if already sent
    if (reminderData.sent) {
      console.log('Reminder already sent:', reminderId);
      return res.status(200).json({ 
        success: true, 
        message: 'Reminder already sent' 
      });
    }

    // Create email HTML
    const emailHtml = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8fafc;">
        <div style="background: ${brand.gradient}; padding: 30px 20px; text-align: center;">
          <h1 style="color: ${brand.textLight}; margin: 0; font-size: 28px;">⏰ Reminder</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px 24px;">
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            Hi <strong>${name}</strong>,
          </p>
          
          <p style="color: ${brand.textDark}; font-size: 16px; line-height: 1.6;">
            This is your reminder for <strong>${projectName}</strong>:
          </p>
          
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0; color: #78350F; font-size: 15px; line-height: 1.6;">
              ${message}
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

    // Send the email
    const emailSent = await sendEmail(
      email,
      `Reminder: ${projectName}`,
      emailHtml
    );

    if (!emailSent) {
      return res.status(500).json({ 
        error: 'Failed to send email' 
      });
    }

    // Mark reminder as sent in Firestore
    await reminderRef.update({
      sent: true,
      sentAt: Timestamp.now()
    });

    console.log('Reminder processed successfully:', reminderId);

    return res.status(200).json({
      success: true,
      message: 'Reminder email sent successfully',
      reminderId
    });

  } catch (error) {
    console.error('Error processing reminder:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
