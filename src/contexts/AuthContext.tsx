import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, facebookProvider, db, persistenceReady } from '../config/firebase';
import { initializeUserProfile, logActivity as logUserActivity } from '../utils/firebaseInit';
import { sendWelcomeEmail } from '../services/mailerSendEmailService';
import { UserProfile, UserRole, OnboardingData, ActivityLog } from '../types/user';
import { diagnoseFirebaseConnection } from '../utils/firebaseDebug';
// Legacy UserData interface for backward compatibility
interface UserData extends UserProfile {
  // Keep existing fields for backward compatibility
  preferences?: {
    theme?: string;
    interests?: string[];
    onboardingCompleted?: boolean;
    completedAt?: any;
    lastUpdated?: any;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isGuest: boolean;
  isAdmin: boolean;
  loading: boolean;
  userRole: UserRole | null;
  signup: (email: string, password: string, displayName: string, phone?: string, role?: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  logActivity: (action: string, page: string, details?: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  completeOnboarding: (onboardingData: OnboardingData) => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  calculateProfileCompletion: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Admin credentials
  const ADMIN_EMAIL = 'admin@wasilah.org';
  const ADMIN_PASSWORD = 'WasilahAdmin2024!';

  const createUserDocument = async (user: User, additionalData: any = {}, retryCount = 0): Promise<UserData> => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000; // 1 second

    try {
      console.log('📝 createUserDocument called for user:', user.email, retryCount > 0 ? `(retry ${retryCount}/${MAX_RETRIES})` : '');
      const userRef = doc(db, 'users', user.uid);
      console.log('Checking if user document exists...');
      
      // Add retry logic for getDoc in case of transient network issues
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (error) {
        console.error('❌ Error reading user document:', error);
        console.error('❌ Error code:', (error as any).code);
        console.error('❌ Error message:', (error as Error).message);
        console.error('❌ User:', user.email, 'UID:', user.uid);
        
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying getDoc in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return createUserDocument(user, additionalData, retryCount + 1);
        }
        
        console.error('❌ FATAL: Failed to read user document after', MAX_RETRIES, 'retries');
        throw new Error(`Failed to read user document: ${(error as Error).message}`);
      }

      if (!userSnap.exists()) {
        // New user - create document
        console.log('New user detected, creating document...');
        const { displayName, email, photoURL } = user;
        const isAdminUser = email === ADMIN_EMAIL;
        
        // Determine role: use additionalData.role, or default to 'volunteer', or 'admin' if admin user
        const userRole: UserRole = additionalData.role || (isAdminUser ? 'admin' : 'volunteer');
        
        // For OAuth users, set both onboarding flags to true to ensure they skip onboarding
        const isOAuthUser = additionalData.preferences?.onboardingCompleted === true;
        
        const userData: UserData = {
          uid: user.uid,
          displayName,
          email,
          photoURL,
          phoneNumber: additionalData.phoneNumber || null,
          role: userRole,
          isAdmin: isAdminUser,
          isGuest: false,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          activityLog: [],
          onboardingCompleted: isOAuthUser, // Set true for OAuth users
          profileCompletionPercentage: isOAuthUser ? 50 : 0, // Give OAuth users partial completion
          ...additionalData,
          // Ensure preferences with defaults, merge if additionalData has preferences
          preferences: {
            theme: 'wasilah-classic',
            language: 'en',
            ...additionalData.preferences,
            onboardingCompleted: additionalData.preferences?.onboardingCompleted || false
          }
        };

        console.log('Writing new user document to Firestore...', isOAuthUser ? '(OAuth user)' : '');
        try {
          await setDoc(userRef, userData);
          console.log('✅ User document created successfully');
        } catch (error) {
          console.error('❌ Error writing user document:', error);
          console.error('❌ Error code:', (error as any).code);
          console.error('❌ Error message:', (error as Error).message);
          console.error('❌ User:', user.email, 'UID:', user.uid);
          console.error('❌ Attempting to write data:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isOAuthUser
          });
          
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying setDoc in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return createUserDocument(user, additionalData, retryCount + 1);
          }
          
          console.error('❌ FATAL: Failed to create user document after', MAX_RETRIES, 'retries');
          console.error('❌ This is likely a Firestore rules or permissions issue');
          throw new Error(`Failed to create user document: ${(error as Error).message}`);
        }
        
        // Fetch the document again to get server-resolved timestamps with retry
        let newUserSnap;
        try {
          newUserSnap = await getDoc(userRef);
          if (!newUserSnap.exists()) {
            throw new Error('User document was not created successfully');
          }
        } catch (error) {
          console.error('❌ Error fetching created user document:', error);
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying fetch in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return createUserDocument(user, additionalData, retryCount + 1);
          }
          throw error;
        }
        
        const finalData = newUserSnap.data() as UserData;
        console.log('✅ User document fetched:', finalData.email, 'onboardingCompleted:', finalData.onboardingCompleted);
        return finalData;
      } else {
        // Existing user - update last login and merge any additional data (e.g., OAuth preferences)
        console.log('Existing user detected, updating last login...');
        const currentData = userSnap.data() as UserData;
        
        const updateData: any = {
          lastLogin: serverTimestamp()
        };
        
        // Merge additionalData if provided (e.g., OAuth users skipping onboarding)
        if (additionalData && Object.keys(additionalData).length > 0) {
          console.log('Merging additional data for existing user:', additionalData);
          
          // Merge preferences if they exist in additionalData
          if (additionalData.preferences) {
            const currentPreferences = currentData.preferences || {};
            
            // Merge preferences (OAuth preferences take precedence)
            updateData['preferences'] = {
              ...currentPreferences,
              ...additionalData.preferences
            };
            
            // If OAuth user is setting onboardingCompleted in preferences, also set top-level flag
            if (additionalData.preferences.onboardingCompleted === true) {
              updateData['onboardingCompleted'] = true;
              console.log('🔵 Setting onboardingCompleted=true for returning OAuth user');
            }
          }
          
          // Merge other fields if needed
          Object.keys(additionalData).forEach(key => {
            if (key !== 'preferences') {
              updateData[key] = additionalData[key];
            }
          });
        }
        
        try {
          await updateDoc(userRef, updateData);
          console.log('✅ Last login updated with additional data');
        } catch (error) {
          console.error('❌ Error updating user document:', error);
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying updateDoc in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return createUserDocument(user, additionalData, retryCount + 1);
          }
          throw error;
        }
        
        // Fetch the updated document with retry
        let updatedUserSnap;
        try {
          updatedUserSnap = await getDoc(userRef);
        } catch (error) {
          console.error('❌ Error fetching updated user document:', error);
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying fetch in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return createUserDocument(user, additionalData, retryCount + 1);
          }
          throw error;
        }
        
        const finalData = updatedUserSnap.data() as UserData;
        console.log('✅ User document fetched:', finalData.email, 'onboardingCompleted:', finalData.onboardingCompleted);
        return finalData;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user document:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack,
        code: (error as any).code // Firebase error codes
      });
      
      // On final failure, clear OAuth flag to prevent stuck state
      if (retryCount >= MAX_RETRIES) {
        console.error('❌ Max retries reached, clearing OAuth redirect flag');
        sessionStorage.removeItem('oauthRedirectCompleted');
      }
      
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string, phone?: string, role?: UserRole) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });

    // Determine role: use provided role, or default to 'volunteer', or 'admin' if admin email
    const userRole: UserRole = role || (email === ADMIN_EMAIL ? 'admin' : 'volunteer');

    // Send email verification with action code settings for proper redirection
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/dashboard',
        handleCodeInApp: true
      } as const;
      await sendEmailVerification(user, actionCodeSettings);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail the signup if email verification fails
    }

    await createUserDocument(user, { 
      phoneNumber: phone,
      role: userRole
    });
    
    // Send role-specific welcome email via MailerSend
    try {
      await sendWelcomeEmail({
        email: email,
        name: displayName,
        role: userRole
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the signup if email fails
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      console.log('🔵 Starting Google login redirect...');
      
      // CRITICAL: Wait for persistence to be set before redirecting
      // This ensures auth state will be preserved after redirect
      console.log('⏳ Waiting for auth persistence to be set...');
      await persistenceReady;
      console.log('✅ Persistence ready, initiating redirect...');
      
      // Use redirect instead of popup to avoid COOP issues
      await signInWithRedirect(auth, googleProvider);
      console.log('🔵 Redirect initiated (this may not log if redirect is immediate)');
      // User will be handled by getRedirectResult in useEffect
    } catch (error) {
      console.error('❌ Error during Google login redirect:', error);
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    try {
      console.log('🔵 Starting Facebook login redirect...');
      
      // CRITICAL: Wait for persistence to be set before redirecting
      console.log('⏳ Waiting for auth persistence to be set...');
      await persistenceReady;
      console.log('✅ Persistence ready, initiating redirect...');
      
      // Use redirect instead of popup to avoid COOP issues
      await signInWithRedirect(auth, facebookProvider);
      console.log('🔵 Redirect initiated (this may not log if redirect is immediate)');
      // User will be handled by getRedirectResult in useEffect
    } catch (error) {
      console.error('❌ Error during Facebook login redirect:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Don't manually set states - let the auth listener handle it
    // This prevents race conditions and ensures consistency
    await signOut(auth);
    // Reset guest mode after signout completes
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setLoading(false);
  };

  const logActivity = async (action: string, page: string, details?: any) => {
    if (currentUser && userData && !userData.isGuest) {
      const now = new Date();
      const activityLog: ActivityLog = {
        id: Date.now().toString(),
        action,
        page,
        timestamp: now,
        details
      };

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const currentData = userSnap.data() as UserData;
        const updatedActivityLog = [...(currentData.activityLog || []), activityLog];

        await updateDoc(userRef, {
          activityLog: updatedActivityLog
        });

        setUserData(prev => prev ? { ...prev, activityLog: updatedActivityLog } : null);
      }
    }
  };

  const resetPassword = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.origin + '/dashboard',
      handleCodeInApp: true
    } as const;
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

  const updatePassword = async (newPassword: string) => {
    if (!currentUser) throw new Error('No user logged in');
    await firebaseUpdatePassword(currentUser, newPassword);
  };

  const resendEmailVerification = async () => {
    if (!currentUser) throw new Error('No user logged in');
    const actionCodeSettings = {
      url: window.location.origin + '/dashboard',
      handleCodeInApp: true
    } as const;
    await sendEmailVerification(currentUser, actionCodeSettings);
  };

  // Helper function to calculate profile completion from onboarding data
  const calculateProfileCompletionFromData = (data: OnboardingData): number => {
    let completed = 0;
    let total = 0;

    total += 4; // Basic info
    if (data.role) completed++;
    if (data.interests && data.interests.length > 0) completed++;
    if (data.skills && data.skills.length > 0) completed++;
    if (data.causes && data.causes.length > 0) completed++;

    total += 2; // Location and availability
    if (data.location) completed++;
    if (data.availability) completed++;

    total += 1; // Role-specific
    if (data.role === 'ngo' && data.organizationName) completed++;
    if (data.role === 'student' && data.institution) completed++;
    if (data.role === 'volunteer' || data.role === 'admin') completed++;

    return Math.round((completed / total) * 100);
  };

  const refreshUserData = async () => {
    if (!currentUser) {
      console.warn('Cannot refresh user data: no current user');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const latestData = userSnap.data() as UserData;
        setUserData(latestData);
        setIsAdmin(latestData.isAdmin);
        setUserRole(latestData.role || 'volunteer');
        console.log('User data refreshed successfully');
      } else {
        console.error('User document does not exist in Firestore');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const completeOnboarding = async (onboardingData: OnboardingData) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: any = {
        role: onboardingData.role,
        interests: onboardingData.interests || [],
        causes: onboardingData.causes || [],
        skills: onboardingData.skills || [],
        location: onboardingData.location || {},
        availability: onboardingData.availability || {},
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        profileCompletionPercentage: calculateProfileCompletionFromData(onboardingData),
        updatedAt: serverTimestamp()
      };

      // Add role-specific data
      if (onboardingData.role === 'ngo') {
        updateData.ngoInfo = {
          organizationName: onboardingData.organizationName || '',
          organizationType: onboardingData.organizationType || '',
          verified: false
        };
      } else if (onboardingData.role === 'student') {
        updateData.studentInfo = {
          institution: onboardingData.institution || '',
          degree: onboardingData.degree || '',
          year: onboardingData.year || ''
        };
      }

      if (onboardingData.bio) {
        updateData.bio = onboardingData.bio;
      }

      await updateDoc(userRef, updateData);
      
      // Refresh user data
      await refreshUserData();
      
      console.log('✅ Onboarding completed successfully');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        role: role,
        updatedAt: serverTimestamp()
      });

      await refreshUserData();
      console.log('✅ User role updated successfully');
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      throw error;
    }
  };

  const calculateProfileCompletion = (): number => {
    if (!userData) return 0;

    let completed = 0;
    let total = 0;

    // Basic information (40%)
    total += 4;
    if (userData.displayName) completed++;
    if (userData.email) completed++;
    if (userData.photoURL) completed++;
    if (userData.phoneNumber) completed++;

    // Profile information (20%)
    total += 2;
    if (userData.bio) completed++;
    if (userData.location) completed++;

    // Skills and interests (20%)
    total += 2;
    if (userData.skills && userData.skills.length > 0) completed++;
    if (userData.interests && userData.interests.length > 0) completed++;

    // Availability (10%)
    total += 1;
    if (userData.availability) completed++;

    // Role-specific (10%)
    total += 1;
    if (userData.role === 'ngo' && userData.ngoInfo?.organizationName) completed++;
    if (userData.role === 'student' && userData.studentInfo?.institution) completed++;
    if (userData.role === 'volunteer' || userData.role === 'admin') completed++;

    return Math.round((completed / total) * 100);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    // Use a ref-like pattern to track OAuth login state across async operations
    let oauthLoginDetected = false;

    // Handle redirect result and set up auth listener
    const initAuth = async () => {
      try {
        // CRITICAL: Wait for persistence to be set before checking redirect result
        // This ensures auth state is preserved across the OAuth redirect
        console.log('⏳ Waiting for Firebase Auth persistence to be ready...');
        await persistenceReady;
        console.log('✅ Persistence ready, checking for OAuth redirect result...');
        
        // Check for redirect result first (from Google/Facebook login)
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User signed in via redirect - create/update their document
          console.log('✅ User authenticated via redirect:', result.user.email);
          oauthLoginDetected = true;
          
          // Set a flag in sessionStorage to indicate OAuth redirect just completed
          // This will help us skip onboarding and go directly to dashboard
          sessionStorage.setItem('oauthRedirectCompleted', 'true');
          console.log('✅ OAuth redirect flag set in sessionStorage');
          
          // The onAuthStateChanged listener below will handle the rest
        } else {
          console.log('No redirect result (normal page load)');
          // Clear any stale OAuth flag on normal page load
          sessionStorage.removeItem('oauthRedirectCompleted');
        }
      } catch (error) {
        console.error('❌ Error handling redirect result:', error);
        // Clear flag on error to prevent stuck states
        sessionStorage.removeItem('oauthRedirectCompleted');
        // Continue to set up auth listener even if redirect fails
      }

      // Set up auth state listener (will catch redirect auth automatically)
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        console.log('Auth state changed. User:', user ? user.email : 'null');
        
        try {
          if (user) {
            // User is authenticated, fetch/create their data
            console.log('Creating/updating user document...');
            
            // Check sessionStorage as backup in case isOAuthLogin wasn't captured
            // This handles edge cases where onAuthStateChanged fires before getRedirectResult completes
            const sessionOAuthFlag = sessionStorage.getItem('oauthRedirectCompleted') === 'true';
            const isOAuthUser = oauthLoginDetected || sessionOAuthFlag;
            
            // For OAuth users, skip onboarding by default
            const additionalData = isOAuthUser ? {
              preferences: {
                onboardingCompleted: true
              }
            } : {};
            
            if (isOAuthUser) {
              console.log('🔵 OAuth user detected - setting onboardingCompleted: true');
            }
            
            const userData = await createUserDocument(user, additionalData);
            console.log('✅ User data loaded:', userData.email);
            
            // Only update state if still mounted
            if (isMounted) {
              setCurrentUser(user);
              setUserData(userData);
              setIsAdmin(userData.isAdmin);
              setUserRole(userData.role || 'volunteer');
              setIsGuest(false);
              setLoading(false);
            }
          } else {
            // No user is logged in
            console.log('No user authenticated, showing welcome screen');
            
            // Clear OAuth flag when user logs out
            sessionStorage.removeItem('oauthRedirectCompleted');
            
            // Only update state if still mounted
            if (isMounted) {
              setCurrentUser(null);
              setUserData(null);
              setIsAdmin(false);
              // Set loading to false regardless of guest mode
              // Guest mode is handled separately by continueAsGuest()
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          console.error('❌ Error details:', {
            message: (error as Error).message,
            code: (error as any).code,
            stack: (error as Error).stack
          });
          
          // Clear OAuth flag on error
          sessionStorage.removeItem('oauthRedirectCompleted');
          
          // IMPORTANT: Do NOT clear currentUser here!
          // The user is still authenticated in Firebase Auth even if Firestore fails
          // Only clear if user is actually null from Firebase
          if (isMounted) {
            setLoading(false);
            
            // Keep the currentUser if we have it - only clear if auth says no user
            if (!user) {
              setCurrentUser(null);
              setUserData(null);
              setIsAdmin(false);
            } else {
              // User is authenticated but we failed to load/create their document
              // Keep them logged in but with null userData
              setCurrentUser(user);
              setUserData(null);
              setIsAdmin(false);
              
              // Log this critical error - user is stuck
              console.error('🚨 CRITICAL: User is authenticated but failed to load profile document');
              console.error('🚨 User email:', user.email);
              console.error('🚨 User UID:', user.uid);
              console.error('🚨 This will cause the user to see welcome screen');
              
              // Run comprehensive diagnostics to help debug
              console.log('🔍 Running Firebase diagnostics...');
              diagnoseFirebaseConnection().then(result => {
                console.log('📊 Diagnostic results:', result);
                if (result.summary.issues.length > 0) {
                  console.error('🚨 Issues found:', result.summary.issues);
                }
                if (result.summary.recommendations.length > 0) {
                  console.log('💡 Recommendations:', result.summary.recommendations);
                }
              }).catch(diagError => {
                console.error('Failed to run diagnostics:', diagError);
              });
            }
          }
        }
      });
    };

    initAuth();
    
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // Remove isGuest dependency to prevent listener recreation
    // Guest mode is independent of auth state changes
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    isGuest,
    isAdmin,
    loading,
    userRole: userRole || userData?.role || null,
    signup,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    continueAsGuest,
    logActivity,
    resetPassword,
    updatePassword,
    resendEmailVerification,
    refreshUserData,
    completeOnboarding,
    updateUserRole,
    calculateProfileCompletion
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};