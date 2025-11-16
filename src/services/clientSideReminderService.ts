/**
 * Client-Side Reminder Service (Spark Plan Compatible)
 * 
 * This service handles reminder checking and sending without requiring Firebase Cloud Functions.
 * It's fully compatible with Firebase Spark (free) plan.
 */

import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendReminderEmail } from './resendEmailService';

interface Reminder {
  id: string;
  name: string;
  email: string;
  projectName: string;
  message: string;
  scheduledAt: Timestamp | Date | string | { toDate: () => Date };
  sent: boolean;
  sentAt?: Timestamp | Date;
  userId: string;
}

/**
 * Check for due reminders and send emails
 * This replaces the Cloud Function 'checkDueReminders'
 */
export async function checkDueReminders(): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    const now = Timestamp.now();

    // Query all unsent reminders
    const remindersQuery = query(
      collection(db, 'reminders'),
      where('sent', '==', false)
    );

    const snapshot = await getDocs(remindersQuery);
    let sentCount = 0;

    // Process each reminder
    for (const docSnap of snapshot.docs) {
      const reminder = { id: docSnap.id, ...docSnap.data() } as Reminder;
      
      // Parse scheduledAt (could be string or Timestamp)
      let scheduledTime: Timestamp;
      if (typeof reminder.scheduledAt === 'string') {
        scheduledTime = Timestamp.fromDate(new Date(reminder.scheduledAt));
      } else if (reminder.scheduledAt instanceof Timestamp) {
        scheduledTime = reminder.scheduledAt;
      } else if (reminder.scheduledAt?.toDate) {
        scheduledTime = Timestamp.fromDate(reminder.scheduledAt.toDate());
      } else {
        console.warn(`Invalid scheduledAt for reminder ${reminder.id}:`, reminder.scheduledAt);
        continue;
      }

      // Check if it's time to send (scheduled time has passed)
      if (scheduledTime.toMillis() <= now.toMillis()) {
        console.log(`Sending reminder ${reminder.id} to ${reminder.email}`);
        
        // Send reminder email using Resend
        const success = await sendReminderEmail({
          email: reminder.email,
          name: reminder.name,
          projectName: reminder.projectName,
          message: reminder.message
        });

        if (success) {
          // Mark as sent
          await updateDoc(doc(db, 'reminders', reminder.id), {
            sent: true,
            sentAt: Timestamp.now()
          });
          sentCount++;
          console.log(`Reminder ${reminder.id} sent successfully`);
        } else {
          console.error(`Failed to send reminder ${reminder.id}`);
        }
      }
    }

    console.log(`Checked reminders: ${sentCount} sent`);
    return { success: true, sentCount };
  } catch (error) {
    console.error('Error checking reminders:', error);
    return { success: false, sentCount: 0, error: (error as Error).message };
  }
}

/**
 * Send a specific reminder immediately
 * This replaces the Cloud Function 'sendReminderNow'
 */
export async function sendReminderNow(reminderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const reminderRef = doc(db, 'reminders', reminderId);
    const reminderSnap = await getDocs(query(collection(db, 'reminders'), where('__name__', '==', reminderId)));

    if (reminderSnap.empty) {
      return { success: false, message: 'Reminder not found' };
    }

    const reminderDoc = reminderSnap.docs[0];
    const reminder = { id: reminderDoc.id, ...reminderDoc.data() } as Reminder;

    if (reminder.sent) {
      return { success: false, message: 'Reminder already sent' };
    }

    // Send reminder email using Resend
    const success = await sendReminderEmail({
      email: reminder.email,
      name: reminder.name,
      projectName: reminder.projectName,
      message: reminder.message
    });

    if (success) {
      // Mark as sent
      await updateDoc(reminderRef, {
        sent: true,
        sentAt: Timestamp.now()
      });
      return { success: true, message: 'Reminder sent successfully' };
    } else {
      return { success: false, message: 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error in sendReminderNow:', error);
    return { success: false, message: (error as Error).message || 'Failed to send reminder' };
  }
}
