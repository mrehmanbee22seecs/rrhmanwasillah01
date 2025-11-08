/**
 * Migration Script: Update Existing Submissions
 * 
 * This script adds new fields to existing submissions:
 * - participantIds (for projects)
 * - attendeeIds (for events)
 * - durationHours (calculated from durationEstimate if missing)
 * 
 * Run this once to update all existing submissions.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Parse duration estimate to hours
const parseDurationEstimate = (estimate?: string): number => {
  if (!estimate) return 2; // Default 2 hours
  
  const lower = estimate.toLowerCase();
  const numbers = lower.match(/\d+/g);
  
  if (!numbers || numbers.length === 0) return 2;
  
  const value = parseInt(numbers[0]);
  
  if (lower.includes('hour') || lower.includes('hr')) {
    return value;
  } else if (lower.includes('day')) {
    return value * 8;
  } else if (lower.includes('week')) {
    return value * 40;
  } else if (lower.includes('month')) {
    return value * 160;
  } else if (lower.includes('minute') || lower.includes('min')) {
    return value / 60;
  }
  
  return value; // Default assume hours
};

async function migrateSubmissions() {
  console.log('🚀 Starting migration of existing submissions...\n');

  try {
    // Migrate project submissions
    console.log('📊 Migrating project submissions...');
    const projectsRef = collection(db, 'project_submissions');
    const projectsSnapshot = await getDocs(projectsRef);
    
    let projectsUpdated = 0;
    const projectBatch = writeBatch(db);
    
    projectsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const updates: any = {};
      
      // Add participantIds if missing (include the submitter)
      if (!data.participantIds && data.submittedBy) {
        updates.participantIds = [data.submittedBy];
        console.log(`  ✅ Adding participantIds to project: ${data.title || docSnapshot.id}`);
      }
      
      // Add durationHours if missing
      if (!data.durationHours && data.durationEstimate) {
        const calculatedHours = parseDurationEstimate(data.durationEstimate);
        updates.durationHours = calculatedHours;
        console.log(`  ✅ Adding durationHours (${calculatedHours}h) to project: ${data.title || docSnapshot.id}`);
      } else if (!data.durationHours && !data.durationEstimate) {
        updates.durationHours = 2; // Default 2 hours
        console.log(`  ⚠️  Setting default durationHours (2h) for project: ${data.title || docSnapshot.id}`);
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const docRef = doc(db, 'project_submissions', docSnapshot.id);
        projectBatch.update(docRef, updates);
        projectsUpdated++;
      }
    });
    
    if (projectsUpdated > 0) {
      await projectBatch.commit();
      console.log(`✅ Updated ${projectsUpdated} project submissions\n`);
    } else {
      console.log('✅ No project submissions needed updating\n');
    }

    // Migrate event submissions
    console.log('📅 Migrating event submissions...');
    const eventsRef = collection(db, 'event_submissions');
    const eventsSnapshot = await getDocs(eventsRef);
    
    let eventsUpdated = 0;
    const eventBatch = writeBatch(db);
    
    eventsSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const updates: any = {};
      
      // Add attendeeIds if missing (include the submitter)
      if (!data.attendeeIds && data.submittedBy) {
        updates.attendeeIds = [data.submittedBy];
        console.log(`  ✅ Adding attendeeIds to event: ${data.title || docSnapshot.id}`);
      }
      
      // Add durationHours if missing
      if (!data.durationHours && data.durationEstimate) {
        const calculatedHours = parseDurationEstimate(data.durationEstimate);
        updates.durationHours = calculatedHours;
        console.log(`  ✅ Adding durationHours (${calculatedHours}h) to event: ${data.title || docSnapshot.id}`);
      } else if (!data.durationHours && !data.durationEstimate) {
        updates.durationHours = 2; // Default 2 hours
        console.log(`  ⚠️  Setting default durationHours (2h) for event: ${data.title || docSnapshot.id}`);
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const docRef = doc(db, 'event_submissions', docSnapshot.id);
        eventBatch.update(docRef, updates);
        eventsUpdated++;
      }
    });
    
    if (eventsUpdated > 0) {
      await eventBatch.commit();
      console.log(`✅ Updated ${eventsUpdated} event submissions\n`);
    } else {
      console.log('✅ No event submissions needed updating\n');
    }

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Total updated: ${projectsUpdated} projects, ${eventsUpdated} events`);
    console.log('\n✅ All existing users\' submissions have been updated with:');
    console.log('   - participantIds/attendeeIds (includes submitter)');
    console.log('   - durationHours (calculated from durationEstimate or default)');
    console.log('\n💡 Existing users can now see their stats on the Dashboard!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateSubmissions()
  .then(() => {
    console.log('\n✅ Migration script completed. You can now close this process.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
