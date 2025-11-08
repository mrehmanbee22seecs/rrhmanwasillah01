import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function migrateApprovedSubmissions() {
  try {
    console.log('Starting visibility migration for approved submissions...');

    let updatedProjects = 0;
    let updatedEvents = 0;

    const projectsQuery = query(
      collection(db, 'project_submissions'),
      where('status', '==', 'approved')
    );
    const projectsSnapshot = await getDocs(projectsQuery);

    for (const docSnapshot of projectsSnapshot.docs) {
      const data = docSnapshot.data();
      if (data.isVisible !== true) {
        await updateDoc(doc(db, 'project_submissions', docSnapshot.id), {
          isVisible: true,
          updatedAt: new Date().toISOString()
        });
        updatedProjects++;
      }
    }

    const eventsQuery = query(
      collection(db, 'event_submissions'),
      where('status', '==', 'approved')
    );
    const eventsSnapshot = await getDocs(eventsQuery);

    for (const docSnapshot of eventsSnapshot.docs) {
      const data = docSnapshot.data();
      if (data.isVisible !== true) {
        await updateDoc(doc(db, 'event_submissions', docSnapshot.id), {
          isVisible: true,
          updatedAt: new Date().toISOString()
        });
        updatedEvents++;
      }
    }

    console.log(`Migration complete! Updated ${updatedProjects} projects and ${updatedEvents} events.`);
    return { updatedProjects, updatedEvents };
  } catch (error) {
    console.error('Error migrating visibility:', error);
    throw error;
  }
}
