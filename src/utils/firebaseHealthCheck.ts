import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, collection, query, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  timestamp: Date;
}

export const checkFirestoreConnection = async (): Promise<HealthCheckResult> => {
  try {
    const testDocRef = doc(db, 'system', 'health_check');
    await setDoc(testDocRef, {
      timestamp: serverTimestamp(),
      test: 'connection'
    });

    const docSnap = await getDoc(testDocRef);

    if (docSnap.exists()) {
      await deleteDoc(testDocRef);
      return {
        service: 'Firestore',
        status: 'healthy',
        message: 'Read and write operations successful',
        timestamp: new Date()
      };
    } else {
      return {
        service: 'Firestore',
        status: 'unhealthy',
        message: 'Document write succeeded but read failed',
        timestamp: new Date()
      };
    }
  } catch (error: any) {
    return {
      service: 'Firestore',
      status: 'unhealthy',
      message: `Connection failed: ${error.message}`,
      timestamp: new Date()
    };
  }
};

export const checkStorageConnection = async (): Promise<HealthCheckResult> => {
  try {
    const testBlob = new Blob(['health check test'], { type: 'text/plain' });
    const testFileName = `system/health_check_${Date.now()}.txt`;
    const storageRef = ref(storage, testFileName);

    await uploadBytes(storageRef, testBlob);
    const downloadURL = await getDownloadURL(storageRef);

    if (downloadURL) {
      await deleteObject(storageRef);
      return {
        service: 'Storage',
        status: 'healthy',
        message: 'Upload and download operations successful',
        timestamp: new Date()
      };
    } else {
      return {
        service: 'Storage',
        status: 'unhealthy',
        message: 'Upload succeeded but download failed',
        timestamp: new Date()
      };
    }
  } catch (error: any) {
    return {
      service: 'Storage',
      status: 'unhealthy',
      message: `Connection failed: ${error.message}`,
      timestamp: new Date()
    };
  }
};

export const checkAuthConnection = async (): Promise<HealthCheckResult> => {
  try {
    if (auth) {
      return {
        service: 'Authentication',
        status: 'healthy',
        message: auth.currentUser ? `User authenticated: ${auth.currentUser.email}` : 'Auth service available',
        timestamp: new Date()
      };
    } else {
      return {
        service: 'Authentication',
        status: 'unhealthy',
        message: 'Auth service not initialized',
        timestamp: new Date()
      };
    }
  } catch (error: any) {
    return {
      service: 'Authentication',
      status: 'unhealthy',
      message: `Connection failed: ${error.message}`,
      timestamp: new Date()
    };
  }
};

export const checkCollectionExists = async (collectionName: string): Promise<HealthCheckResult> => {
  try {
    const q = query(collection(db, collectionName), limit(1));
    const snapshot = await getDocs(q);

    return {
      service: `Collection: ${collectionName}`,
      status: 'healthy',
      message: `Collection exists with ${snapshot.size} documents (sample)`,
      timestamp: new Date()
    };
  } catch (error: any) {
    return {
      service: `Collection: ${collectionName}`,
      status: 'unhealthy',
      message: `Failed to access: ${error.message}`,
      timestamp: new Date()
    };
  }
};

export const runFullHealthCheck = async (): Promise<HealthCheckResult[]> => {
  console.log('🏥 Running Firebase Health Check...');

  const results: HealthCheckResult[] = [];

  const firestoreCheck = await checkFirestoreConnection();
  results.push(firestoreCheck);
  console.log(`${firestoreCheck.status === 'healthy' ? '✅' : '❌'} Firestore: ${firestoreCheck.message}`);

  const storageCheck = await checkStorageConnection();
  results.push(storageCheck);
  console.log(`${storageCheck.status === 'healthy' ? '✅' : '❌'} Storage: ${storageCheck.message}`);

  const authCheck = await checkAuthConnection();
  results.push(authCheck);
  console.log(`${authCheck.status === 'healthy' ? '✅' : '❌'} Authentication: ${authCheck.message}`);

  const collections = [
    'users',
    'project_submissions',
    'event_submissions',
    'hero_content',
    'programs',
    'testimonials',
    'leaders',
    'editableContent'
  ];

  for (const collectionName of collections) {
    const collectionCheck = await checkCollectionExists(collectionName);
    results.push(collectionCheck);
    console.log(`${collectionCheck.status === 'healthy' ? '✅' : '❌'} ${collectionCheck.service}: ${collectionCheck.message}`);
  }

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;

  console.log(`\n📊 Health Check Complete: ${healthyCount}/${totalCount} services healthy`);

  return results;
};

export const getHealthCheckSummary = (results: HealthCheckResult[]) => {
  const healthy = results.filter(r => r.status === 'healthy').length;
  const unhealthy = results.filter(r => r.status === 'unhealthy').length;
  const unknown = results.filter(r => r.status === 'unknown').length;
  const total = results.length;

  return {
    total,
    healthy,
    unhealthy,
    unknown,
    healthPercentage: Math.round((healthy / total) * 100),
    overallStatus: unhealthy === 0 ? 'healthy' : 'degraded'
  };
};
