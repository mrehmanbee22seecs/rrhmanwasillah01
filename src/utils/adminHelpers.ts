/**
 * Admin Helper Functions
 * Utility functions for admin operations
 */

import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendProjectUpdateNotification } from './notificationHelpers';

export async function updateSubmissionStatus(
  submissionId: string,
  type: 'project' | 'event',
  status: 'approved' | 'rejected',
  comments?: string,
  reason?: string,
  currentUser?: { uid: string; email?: string | null }
) {
  const collectionName = type === 'project' ? 'project_submissions' : 'event_submissions';
  const submissionRef = doc(db, collectionName, submissionId);

  const updateData: any = {
    status,
    isVisible: status === 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: currentUser?.uid,
    adminComments: comments || '',
    rejectionReason: reason || '',
    updatedAt: serverTimestamp(),
  };

  await updateDoc(submissionRef, updateData);

  // Send notification
  // Note: We'd need to fetch the submission first to get submitter info
  // This is a simplified version
  try {
    // In a real implementation, fetch submission first to get submitter info
    // await sendProjectUpdateNotification({...});
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

