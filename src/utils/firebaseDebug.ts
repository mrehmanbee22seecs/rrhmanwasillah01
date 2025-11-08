/**
 * Firebase Debug Utility
 * 
 * This utility provides comprehensive diagnostics for Firebase connectivity
 * and OAuth authentication flow. Use it to debug OAuth login issues.
 * 
 * Usage: Import and call diagnoseFi rebaseConnection() from browser console
 */

import { auth, db } from '../config/firebase';
import { getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

export interface DiagnosticResult {
  timestamp: Date;
  tests: {
    firebaseInit: { status: 'pass' | 'fail'; message: string };
    authService: { status: 'pass' | 'fail'; message: string; details?: any };
    firestoreService: { status: 'pass' | 'fail'; message: string; details?: any };
    authState: { status: 'pass' | 'fail'; message: string; details?: any };
    firestoreRead: { status: 'pass' | 'fail'; message: string; details?: any };
    firestoreWrite: { status: 'pass' | 'fail'; message: string; details?: any };
    redirectResult: { status: 'pass' | 'fail'; message: string; details?: any };
  };
  summary: {
    passed: number;
    failed: number;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Run comprehensive Firebase diagnostics
 */
export async function diagnoseFirebaseConnection(): Promise<DiagnosticResult> {
  console.log('🔍 Starting Firebase Diagnostics...');
  console.log('================================================');
  
  const result: DiagnosticResult = {
    timestamp: new Date(),
    tests: {
      firebaseInit: { status: 'fail', message: '' },
      authService: { status: 'fail', message: '' },
      firestoreService: { status: 'fail', message: '' },
      authState: { status: 'fail', message: '' },
      firestoreRead: { status: 'fail', message: '' },
      firestoreWrite: { status: 'fail', message: '' },
      redirectResult: { status: 'fail', message: '' },
    },
    summary: {
      passed: 0,
      failed: 0,
      issues: [],
      recommendations: [],
    },
  };

  // Test 1: Firebase Initialization
  console.log('\n1️⃣ Testing Firebase Initialization...');
  try {
    if (auth && db) {
      result.tests.firebaseInit = {
        status: 'pass',
        message: 'Firebase Auth and Firestore initialized successfully',
      };
      console.log('✅ Firebase initialized');
    } else {
      result.tests.firebaseInit = {
        status: 'fail',
        message: 'Firebase Auth or Firestore not initialized',
      };
      console.error('❌ Firebase initialization failed');
    }
  } catch (error) {
    result.tests.firebaseInit = {
      status: 'fail',
      message: `Initialization error: ${(error as Error).message}`,
    };
    console.error('❌ Firebase initialization error:', error);
  }

  // Test 2: Auth Service Status
  console.log('\n2️⃣ Testing Auth Service...');
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      result.tests.authService = {
        status: 'pass',
        message: 'User is authenticated',
        details: {
          email: currentUser.email,
          uid: currentUser.uid,
          emailVerified: currentUser.emailVerified,
          displayName: currentUser.displayName,
        },
      };
      console.log('✅ User authenticated:', currentUser.email);
      console.log('   UID:', currentUser.uid);
    } else {
      result.tests.authService = {
        status: 'fail',
        message: 'No user currently authenticated',
      };
      console.log('⚠️  No user authenticated');
    }
  } catch (error) {
    result.tests.authService = {
      status: 'fail',
      message: `Auth service error: ${(error as Error).message}`,
    };
    console.error('❌ Auth service error:', error);
  }

  // Test 3: Firestore Service Status
  console.log('\n3️⃣ Testing Firestore Service...');
  try {
    if (db) {
      result.tests.firestoreService = {
        status: 'pass',
        message: 'Firestore service is available',
        details: {
          type: db.type,
        },
      };
      console.log('✅ Firestore service available');
    } else {
      result.tests.firestoreService = {
        status: 'fail',
        message: 'Firestore service not initialized',
      };
      console.error('❌ Firestore service not available');
    }
  } catch (error) {
    result.tests.firestoreService = {
      status: 'fail',
      message: `Firestore service error: ${(error as Error).message}`,
    };
    console.error('❌ Firestore service error:', error);
  }

  // Test 4: Auth State Listener
  console.log('\n4️⃣ Testing Auth State Listener...');
  try {
    const authStatePromise = new Promise<any>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 3000);
    });
    
    const user = await authStatePromise;
    if (user) {
      result.tests.authState = {
        status: 'pass',
        message: 'Auth state listener working',
        details: {
          email: user.email,
          uid: user.uid,
        },
      };
      console.log('✅ Auth state listener working');
    } else {
      result.tests.authState = {
        status: 'fail',
        message: 'Auth state listener did not detect a user',
      };
      console.log('⚠️  Auth state listener: no user detected');
    }
  } catch (error) {
    result.tests.authState = {
      status: 'fail',
      message: `Auth state listener error: ${(error as Error).message}`,
    };
    console.error('❌ Auth state listener error:', error);
  }

  // Test 5: Firestore Read (only if authenticated)
  console.log('\n5️⃣ Testing Firestore Read...');
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        result.tests.firestoreRead = {
          status: 'pass',
          message: 'Successfully read user document from Firestore',
          details: {
            email: userData.email,
            onboardingCompleted: userData.onboardingCompleted,
            preferencesOnboardingCompleted: userData.preferences?.onboardingCompleted,
            createdAt: userData.createdAt,
          },
        };
        console.log('✅ Read user document');
        console.log('   Email:', userData.email);
        console.log('   Onboarding completed:', userData.onboardingCompleted);
        console.log('   Preferences onboarding:', userData.preferences?.onboardingCompleted);
      } else {
        result.tests.firestoreRead = {
          status: 'fail',
          message: 'User document does not exist in Firestore',
        };
        console.error('❌ User document not found in Firestore');
        result.summary.issues.push('User document missing - needs to be created');
      }
    } catch (error: any) {
      result.tests.firestoreRead = {
        status: 'fail',
        message: `Firestore read error: ${error.message}`,
        details: {
          code: error.code,
          message: error.message,
        },
      };
      console.error('❌ Firestore read error:', error);
      console.error('   Code:', error.code);
      
      if (error.code === 'permission-denied') {
        result.summary.issues.push('Firestore read permission denied - check security rules');
        result.summary.recommendations.push('Verify Firestore rules allow authenticated users to read their own documents');
      }
    }
  } else {
    result.tests.firestoreRead = {
      status: 'fail',
      message: 'Cannot test read - no authenticated user',
    };
    console.log('⚠️  Skipping Firestore read test (no authenticated user)');
  }

  // Test 6: Firestore Write (only if authenticated)
  console.log('\n6️⃣ Testing Firestore Write...');
  if (currentUser) {
    try {
      const testRef = doc(db, 'users', currentUser.uid);
      const testData = {
        _diagnosticTest: true,
        _diagnosticTimestamp: serverTimestamp(),
      };
      
      await setDoc(testRef, testData, { merge: true });
      
      result.tests.firestoreWrite = {
        status: 'pass',
        message: 'Successfully wrote to Firestore',
      };
      console.log('✅ Write to Firestore successful');
    } catch (error: any) {
      result.tests.firestoreWrite = {
        status: 'fail',
        message: `Firestore write error: ${error.message}`,
        details: {
          code: error.code,
          message: error.message,
        },
      };
      console.error('❌ Firestore write error:', error);
      console.error('   Code:', error.code);
      
      if (error.code === 'permission-denied') {
        result.summary.issues.push('Firestore write permission denied - check security rules');
        result.summary.recommendations.push('Verify Firestore rules allow authenticated users to create/update their own documents');
      }
    }
  } else {
    result.tests.firestoreWrite = {
      status: 'fail',
      message: 'Cannot test write - no authenticated user',
    };
    console.log('⚠️  Skipping Firestore write test (no authenticated user)');
  }

  // Test 7: OAuth Redirect Result
  console.log('\n7️⃣ Testing OAuth Redirect Result...');
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult && redirectResult.user) {
      result.tests.redirectResult = {
        status: 'pass',
        message: 'OAuth redirect detected',
        details: {
          email: redirectResult.user.email,
          uid: redirectResult.user.uid,
        },
      };
      console.log('✅ OAuth redirect detected');
      console.log('   Email:', redirectResult.user.email);
    } else {
      result.tests.redirectResult = {
        status: 'pass',
        message: 'No pending OAuth redirect (normal state)',
      };
      console.log('ℹ️  No pending OAuth redirect');
    }
  } catch (error) {
    result.tests.redirectResult = {
      status: 'fail',
      message: `OAuth redirect error: ${(error as Error).message}`,
    };
    console.error('❌ OAuth redirect error:', error);
  }

  // Calculate summary
  console.log('\n📊 Calculating Summary...');
  Object.values(result.tests).forEach((test) => {
    if (test.status === 'pass') {
      result.summary.passed++;
    } else {
      result.summary.failed++;
    }
  });

  // Generate recommendations
  if (!currentUser) {
    result.summary.recommendations.push('Log in with Google to run full diagnostics');
  }

  if (result.tests.firestoreRead.status === 'fail' && currentUser) {
    result.summary.recommendations.push('User document may need to be created manually or Firestore rules may be blocking access');
  }

  // Print final summary
  console.log('\n================================================');
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('================================================');
  console.log(`✅ Passed: ${result.summary.passed}`);
  console.log(`❌ Failed: ${result.summary.failed}`);
  
  if (result.summary.issues.length > 0) {
    console.log('\n🚨 Issues Found:');
    result.summary.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (result.summary.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.summary.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n================================================');
  console.log('🔍 Diagnostic complete!');
  console.log('================================================\n');

  return result;
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).diagnoseFirebase = diagnoseFirebaseConnection;
  console.log('💡 Firebase diagnostics available: call window.diagnoseFirebase() in console');
}

export default diagnoseFirebaseConnection;
