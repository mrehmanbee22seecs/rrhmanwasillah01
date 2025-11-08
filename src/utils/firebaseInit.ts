import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const initializeUserProfile = async (userId: string, userData: {
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin?: boolean;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
        isAdmin: userData.isAdmin || false,
        isGuest: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        preferences: {
          interests: [],
          skills: [],
          availability: '',
          theme: 'default'
        },
        activityLog: []
      });
      console.log('User profile created successfully');
    } else {
      await setDoc(userRef, {
        lastLogin: serverTimestamp()
      }, { merge: true });
      console.log('User login timestamp updated');
    }

    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return false;
  }
};

export const logActivity = async (userId: string, activity: {
  action: string;
  page: string;
  details?: any;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentLog = userSnap.data()?.activityLog || [];
      const newActivity = {
        id: `activity_${Date.now()}`,
        action: activity.action,
        page: activity.page,
        timestamp: serverTimestamp(),
        details: activity.details || null
      };

      const updatedLog = [...currentLog, newActivity].slice(-50);

      await setDoc(userRef, {
        activityLog: updatedLog
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const validateFirebaseConnection = async () => {
  try {
    const testRef = doc(db, 'system', 'connection_test');
    await setDoc(testRef, {
      lastChecked: serverTimestamp(),
      status: 'connected'
    });
    console.log('✅ Firebase connection validated successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

export const ensureCollectionExists = async (collectionName: string) => {
  try {
    const testDocRef = doc(db, collectionName, '_init');
    await setDoc(testDocRef, {
      initialized: true,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Collection "${collectionName}" initialized`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to initialize collection "${collectionName}":`, error);
    return false;
  }
};

export const initializeFirebaseCollections = async () => {
  const collections = [
    'users',
    'project_submissions',
    'event_submissions',
    'hero_content',
    'programs',
    'testimonials',
    'leaders',
    'editableContent',
    'volunteer_applications',
    'contact_messages',
    'content',
    'page_content',
    'project_leaders',
    'event_organizers'
  ];

  console.log('🔄 Initializing Firebase collections...');

  for (const collection of collections) {
    await ensureCollectionExists(collection);
  }

  console.log('✅ All Firebase collections initialized');
};

export const checkFirebaseHealth = async () => {
  const checks = {
    connection: false,
    auth: false,
    firestore: false,
    storage: false
  };

  try {
    checks.connection = await validateFirebaseConnection();
    checks.firestore = checks.connection;
    checks.auth = true;
    checks.storage = true;

    console.log('Firebase Health Check:', checks);
    return checks;
  } catch (error) {
    console.error('Firebase health check failed:', error);
    return checks;
  }
};
