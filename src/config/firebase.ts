import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

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

// Configure Google Auth Provider with popup settings
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

// Initialize Firebase Cloud Messaging (only in browser, and if supported)
export let messaging: Messaging | null = null;

// Initialize messaging asynchronously
export async function initializeMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (messaging) {
    return messaging;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (error) {
    console.warn('Firebase Cloud Messaging not supported:', error);
  }

  return null;
}

// Try to initialize messaging immediately if in browser
if (typeof window !== 'undefined') {
  initializeMessaging().catch(() => {
    // Silently fail if messaging can't be initialized
  });
}

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