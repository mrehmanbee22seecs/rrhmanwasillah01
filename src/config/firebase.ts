import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCAzJf4xhj8YHT6ArbmVdzkOpGKwFTHkCU",
  authDomain: "wasilah-new.firebaseapp.com",
  projectId: "wasilah-new",
  storageBucket: "wasilah-new.firebasestorage.app",
  messagingSenderId: "577353648201",
  appId: "1:577353648201:web:322c63144b84db4d2c5798"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// CRITICAL: Create a promise to track when persistence is set
// This MUST complete before any signInWithRedirect calls
let persistenceReady: Promise<void>;

try {
  console.log('🔧 Setting Firebase Auth persistence to browserLocalPersistence...');
  persistenceReady = setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Firebase Auth persistence set successfully');
    })
    .catch((error) => {
      console.error('❌ CRITICAL: Failed to set auth persistence:', error);
      console.error('❌ This will cause OAuth redirects to fail!');
      console.error('❌ Attempting fallback to inMemoryPersistence...');
      return setPersistence(auth, inMemoryPersistence)
        .then(() => {
          console.log('⚠️  Fallback: Using inMemoryPersistence (session will not persist across page reloads)');
        })
        .catch((fallbackError) => {
          console.error('❌ FATAL: Could not set any persistence mode:', fallbackError);
          throw fallbackError;
        });
    });
} catch (error) {
  console.error('❌ FATAL: Error initializing persistence:', error);
  persistenceReady = Promise.reject(error);
}

// Export the persistence promise so login functions can wait for it
export { persistenceReady };

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configure Facebook Auth Provider
export const facebookProvider = new FacebookAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Cloud Functions (client)
export const functions = getFunctions(app);

export default app;

// Expose Firebase to window for browser console access (development only)
if (typeof window !== 'undefined') {
  (window as any).db = db;
  (window as any).auth = auth;
  (window as any).storage = storage;
  
  // Also expose Firestore functions for console scripts
  import('firebase/firestore').then((firestoreModule) => {
    (window as any).firestoreExports = firestoreModule;
  });
}