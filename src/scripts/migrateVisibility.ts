/**
 * Data Migration Script: Fix Visibility for Approved Submissions
 *
 * This script updates all approved project and event submissions to have
 * the isVisible field set to true, ensuring they appear on public pages.
 *
 * Run this script once to fix existing data.
 */

import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

interface MigrationResult {
  projectsUpdated: number;
  eventsUpdated: number;
  errors: string[];
}

export async function migrateVisibility(): Promise<MigrationResult> {
  const result: MigrationResult = {
    projectsUpdated: 0,
    eventsUpdated: 0,
    errors: []
  };

  console.log('Starting visibility migration...');

  try {
    const batch = writeBatch(db);
    let batchCount = 0;

    const projectsRef = collection(db, 'project_submissions');
    const projectsSnapshot = await getDocs(projectsRef);

    console.log(`Found ${projectsSnapshot.size} project submissions`);

    for (const docSnapshot of projectsSnapshot.docs) {
      const data = docSnapshot.data();

      if (data.status === 'approved' && data.isVisible !== true) {
        const docRef = doc(db, 'project_submissions', docSnapshot.id);

        batch.update(docRef, {
          isVisible: true,
          updatedAt: new Date(),
          migrationNote: 'Visibility field added during migration'
        });

        result.projectsUpdated++;
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }

    const eventsRef = collection(db, 'event_submissions');
    const eventsSnapshot = await getDocs(eventsRef);

    console.log(`Found ${eventsSnapshot.size} event submissions`);

    for (const docSnapshot of eventsSnapshot.docs) {
      const data = docSnapshot.data();

      if (data.status === 'approved' && data.isVisible !== true) {
        const docRef = doc(db, 'event_submissions', docSnapshot.id);

        batch.update(docRef, {
          isVisible: true,
          updatedAt: new Date(),
          migrationNote: 'Visibility field added during migration'
        });

        result.eventsUpdated++;
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log('Migration completed successfully!');
    console.log(`Projects updated: ${result.projectsUpdated}`);
    console.log(`Events updated: ${result.eventsUpdated}`);

  } catch (error: any) {
    console.error('Migration error:', error);
    result.errors.push(error.message || 'Unknown error');
  }

  return result;
}

export async function migrateIndividualDocument(
  collectionName: 'project_submissions' | 'event_submissions',
  documentId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId);

    await updateDoc(docRef, {
      isVisible: true,
      updatedAt: new Date()
    });

    console.log(`Successfully updated ${collectionName}/${documentId}`);
    return true;
  } catch (error: any) {
    console.error(`Error updating ${collectionName}/${documentId}:`, error);
    return false;
  }
}

if (typeof window !== 'undefined' && (window as any).runMigration) {
  (window as any).runMigration = migrateVisibility;
  (window as any).migrateDocument = migrateIndividualDocument;
  console.log('Migration functions loaded. Run window.runMigration() to start.');
}
