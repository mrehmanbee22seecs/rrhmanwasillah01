import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword as firebaseUpdatePassword,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, facebookProvider, db } from '../config/firebase';
// Note: initializeUserProfile and logActivity are kept for potential future use
// import { initializeUserProfile, logActivity as logUserActivity } from '../utils/firebaseInit';
import { sendWelcomeEmail } from '../services/mailerSendEmailService';
import { UserProfile, UserRole, OnboardingData, ActivityLog } from '../types/user';
import { sendWelcomeNotification } from '../utils/notificationHelpers';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Admin credentials
  const ADMIN_EMAIL = 'admin@wasilah.org';
  // ADMIN_PASSWORD is kept for reference but not used in code (admin login handled via Firebase)
  // const ADMIN_PASSWORD = 'WasilahAdmin2024!';

  const createUserDocument = async (user: User, additionalData: any = {}) => {
    try {
      console.log('📝 createUserDocument called for user:', user.email);
      const userRef = doc(db, 'users', user.uid);
      console.log('Checking if user document exists...');
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user - create document
        console.log('New user detected, creating document...');
        const { displayName, email, photoURL } = user;
        const isAdminUser = email === ADMIN_EMAIL;
        
        // Determine role: use additionalData.role, or default to 'volunteer', or 'admin' if admin user
        const userRole: UserRole = additionalData.role || (isAdminUser ? 'admin' : 'volunteer');
        
        // Determine onboarding status from additionalData
        const onboardingCompleted = additionalData.preferences?.onboardingCompleted || 
                                     additionalData.onboardingCompleted || 
                                     false;
        
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
          onboardingCompleted: onboardingCompleted,
          profileCompletionPercentage: 0,
          ...additionalData,
          // Ensure preferences with defaults, merge if additionalData has preferences
          preferences: {
            theme: 'wasilah-classic',
            language: 'en',
            ...additionalData.preferences,
            onboardingCompleted: onboardingCompleted
          }
        };

        console.log('Writing new user document to Firestore...');
        await setDoc(userRef, userData);
        console.log('✅ User document created successfully');
        
        // Send welcome notification
        try {
          await sendWelcomeNotification(user.uid, displayName || 'User', userRole);
        } catch (error) {
          console.error('Error sending welcome notification:', error);
          // Don't fail user creation if notification fails
        }
        
        // Fetch the document again to get server-resolved timestamps
        const newUserSnap = await getDoc(userRef);
        const finalData = newUserSnap.data() as UserData;
        console.log('✅ User document fetched:', finalData.email);
        return finalData;
      } else {
        // Existing user - update last login and merge any additional data (e.g., OAuth preferences)
        console.log('Existing user detected, updating last login...');
        const updateData: any = {
          lastLogin: serverTimestamp()
        };
        
        // Merge additionalData if provided (e.g., OAuth users skipping onboarding)
        if (additionalData && Object.keys(additionalData).length > 0) {
          console.log('Merging additional data for existing user:', additionalData);
          // Merge preferences if they exist in additionalData
          if (additionalData.preferences) {
            // Get current preferences first
            const currentData = userSnap.data() as UserData;
            const currentPreferences = currentData.preferences || {};
            
            // Merge preferences (OAuth preferences take precedence)
            updateData['preferences'] = {
              ...currentPreferences,
              ...additionalData.preferences
            };
          }
          // Merge other fields if needed
          Object.keys(additionalData).forEach(key => {
            if (key !== 'preferences') {
              updateData[key] = additionalData[key];
            }
          });
        }
        
        await updateDoc(userRef, updateData);
        console.log('✅ Last login updated with additional data');
        
        // Fetch the updated document
        const updatedUserSnap = await getDoc(userRef);
        const finalData = updatedUserSnap.data() as UserData;
        console.log('✅ User document fetched:', finalData.email);
        return finalData;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user document:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack
      });
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
      const hostname = window.location.hostname;
      console.log('🔵 [OAuth] loginWithGoogle: Setting local persistence before sign-in...');
      
      // CRITICAL: Ensure auth state persists across redirects and page reloads
      // This prevents ephemeral sessions that disappear on redirect
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ [OAuth] Persistence set to browserLocalPersistence');
      } catch (persistError: any) {
        console.warn('⚠️ [OAuth] setPersistence failed (non-fatal):', persistError);
        // Continue anyway - some browsers may not support this
      }
      
      // Warn if domain might not be authorized
      if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        console.log('🔵 [OAuth] Production domain detected:', hostname);
        console.warn('⚠️ [OAuth] Ensure this domain is authorized in Firebase Console');
        console.warn('⚠️ [OAuth] Go to: Firebase Console > Authentication > Settings > Authorized domains');
      }
      
      // Strategy: Try popup first (better UX), fallback to redirect if popup is blocked
      try {
        console.log('🔵 [OAuth] Attempting signInWithPopup for Google (preferred method)...');
        await signInWithPopup(auth, googleProvider);
        console.log('✅ [OAuth] signInWithPopup succeeded - no redirect needed');
        // Popup succeeded - onAuthStateChanged listener will catch the user
        // No need to set redirect flags
        return;
      } catch (popupErr: any) {
        console.warn('⚠️ [OAuth] signInWithPopup failed or was blocked - falling back to redirect');
        console.warn('⚠️ [OAuth] Popup error:', popupErr?.code, popupErr?.message);
        
        // Popup failed/blocked - fallback to redirect
        // CRITICAL: Set flag BEFORE redirect so we know this was an OAuth flow on return
        sessionStorage.setItem('wasillah_oauth_in_progress', '1');
        sessionStorage.setItem('wasillah_oauth_provider', 'google.com');
        sessionStorage.setItem('wasillah_oauth_time', Date.now().toString());
        
        console.log('🔵 [OAuth] Initiating signInWithRedirect for Google...');
        console.log('🔵 [OAuth] Flag set: wasillah_oauth_in_progress = 1');
        
        await signInWithRedirect(auth, googleProvider);
        // Browser will redirect away; nothing further executes here
      }
    } catch (error: any) {
      console.error('❌ [OAuth] loginWithGoogle: Unexpected error', error);
      console.error('❌ [OAuth] Error code:', error?.code);
      console.error('❌ [OAuth] Error message:', error?.message);
      console.error('❌ [OAuth] Full error:', error);
      
      // Clear flags on error
      sessionStorage.removeItem('wasillah_oauth_in_progress');
      sessionStorage.removeItem('wasillah_oauth_provider');
      sessionStorage.removeItem('wasillah_oauth_time');
      
      // Provide helpful error messages
      if (error?.code === 'auth/unauthorized-domain') {
        const errorMsg = `❌ UNAUTHORIZED DOMAIN: "${window.location.hostname}" is not authorized in Firebase Console.\n\nPlease:\n1. Go to Firebase Console > Authentication > Settings > Authorized domains\n2. Click "Add domain"\n3. Add: ${window.location.hostname}\n4. Wait 1-2 minutes for changes to propagate\n5. Try again`;
        throw new Error(errorMsg);
      } else if (error?.code === 'auth/operation-not-allowed') {
        const errorMsg = `Google sign-in is not enabled in Firebase Console.\n\nPlease:\n1. Go to Firebase Console > Authentication > Sign-in method\n2. Click on "Google"\n3. Enable Google sign-in\n4. Save and try again`;
        throw new Error(errorMsg);
      } else if (error?.message) {
        throw new Error(`OAuth error: ${error.message}`);
      }
      
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    try {
      console.log('🔵 [OAuth] loginWithFacebook: Setting local persistence before sign-in...');
      
      // Ensure auth state persists across redirects
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ [OAuth] Persistence set to browserLocalPersistence');
      } catch (persistError: any) {
        console.warn('⚠️ [OAuth] setPersistence failed (non-fatal):', persistError);
      }
      
      // Try popup first, fallback to redirect
      try {
        console.log('🔵 [OAuth] Attempting signInWithPopup for Facebook...');
        await signInWithPopup(auth, facebookProvider);
        console.log('✅ [OAuth] signInWithPopup succeeded');
        return;
      } catch (popupErr: any) {
        console.warn('⚠️ [OAuth] signInWithPopup failed - falling back to redirect');
        
        // Set flag BEFORE redirect
        sessionStorage.setItem('wasillah_oauth_in_progress', '1');
        sessionStorage.setItem('wasillah_oauth_provider', 'facebook.com');
        sessionStorage.setItem('wasillah_oauth_time', Date.now().toString());
        
        console.log('🔵 [OAuth] Initiating signInWithRedirect for Facebook...');
        await signInWithRedirect(auth, facebookProvider);
      }
    } catch (error: any) {
      console.error('❌ [OAuth] loginWithFacebook: Error', error);
      sessionStorage.removeItem('wasillah_oauth_in_progress');
      sessionStorage.removeItem('wasillah_oauth_provider');
      sessionStorage.removeItem('wasillah_oauth_time');
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

        setUserData((prev: UserData | null) => prev ? { ...prev, activityLog: updatedActivityLog } : null);
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

    // Handle redirect result and set up auth listener
    const initAuth = async () => {
      let isOAuthLogin = false;

      try {
        // CRITICAL: Always set persistence at init time too (for other flows)
        try {
          await setPersistence(auth, browserLocalPersistence);
          console.log('✅ [OAuth] Persistence set at init');
        } catch (pErr: any) {
          console.warn('⚠️ [OAuth] setPersistence failed at init (non-fatal):', pErr);
        }

        console.log('🔍 [OAuth] Checking for redirect result...');
        console.log('🔍 [OAuth] Current URL:', window.location.href);
        
        // Check for redirect flag - this tells us an OAuth redirect was initiated
        const oauthInProgress = sessionStorage.getItem('wasillah_oauth_in_progress');
        if (oauthInProgress) {
          console.log('🔍 [OAuth] OAuth redirect flag detected: wasillah_oauth_in_progress =', oauthInProgress);
        }
        
        // Try to get redirect result (may return null even if user signed in due to race conditions)
        const result = await getRedirectResult(auth).catch((e: any) => {
          console.warn('⚠️ [OAuth] getRedirectResult caught error (continuing):', e?.code, e?.message);
          return null;
        });

        if (result && result.user) {
          console.log('✅ [OAuth] User authenticated via getRedirectResult:', result.user.email);
          console.log('✅ [OAuth] Provider:', result.providerId);
          console.log('✅ [OAuth] Operation Type:', result.operationType);
          isOAuthLogin = true;
          
          // Set completion flag for ProtectedRoute
          sessionStorage.setItem('oauthRedirectCompleted', 'true');
        } else {
          // No redirect result - check if we had a redirect flag
          if (oauthInProgress) {
            console.log('🔍 [OAuth] Redirect flag present but getRedirectResult returned null');
            console.log('🔍 [OAuth] Will rely on onAuthStateChanged to detect user');
            // Don't clear flag here - wait for onAuthStateChanged to process user
            // This handles the case where getRedirectResult returns null but user is authenticated
          } else {
            console.log('ℹ️ [OAuth] No redirect result (normal page load)');
            // Clear any stale completion flags
            sessionStorage.removeItem('oauthRedirectCompleted');
          }
        }
      } catch (error: any) {
        console.error('❌ [OAuth] Error handling redirect result:', error);
        console.error('❌ [OAuth] Error code:', error?.code);
        console.error('❌ [OAuth] Error message:', error?.message);
        // Continue to auth listener - don't fail completely
      }

      // Auth state listener (primary source of truth for authentication)
      unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (!isMounted) return;
        
        console.log('🔍 [OAuth] Auth state changed. User:', user ? user.email : 'null');
        
        try {
          if (user) {
            // Check if we had an OAuth redirect in progress
            const oauthFlag = !!sessionStorage.getItem('wasillah_oauth_in_progress');
            
            // Clear redirect flag now that we have an authenticated user
            if (oauthFlag) {
              sessionStorage.removeItem('wasillah_oauth_in_progress');
              sessionStorage.removeItem('wasillah_oauth_provider');
              sessionStorage.removeItem('wasillah_oauth_time');
              console.log('✅ [OAuth] Cleared oauth redirect in-progress flag');
              isOAuthLogin = true; // Mark as OAuth login
            }
            
            // Also check if user signed in with OAuth provider (fallback detection)
            const isOAuthProvider = user.providerData.some(
              (provider: any) => provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
            );
            
            if (isOAuthProvider) {
              console.log('🔍 [OAuth] User authenticated via OAuth provider:', 
                user.providerData.find((p: any) => p.providerId === 'google.com' || p.providerId === 'facebook.com')?.providerId
              );
            }
            
            // Determine if this is an OAuth login
            // Priority: 1) Flag from getRedirectResult, 2) Redirect flag, 3) OAuth provider (for popup flows)
            // For popup flows: If user has OAuth provider, treat as OAuth (popup doesn't set redirect flag)
            // For redirect flows: We rely on the flag (already set above)
            let isOAuthUser = isOAuthLogin || oauthFlag;
            
            // If popup succeeded and user has OAuth provider, also treat as OAuth
            // (Popup doesn't set redirect flag, so we detect via provider)
            if (!isOAuthUser && isOAuthProvider) {
              console.log('🔍 [OAuth] Popup flow detected via OAuth provider');
              // For popup flows, treat as OAuth if provider is Google/Facebook
              // This handles the case where popup succeeds but no redirect flag was set
              isOAuthUser = true;
              console.log('🔵 [OAuth] Popup OAuth user detected');
            }
            
            // Create/update user document
            console.log('🔍 [OAuth] Creating/updating user document...');
            
            // For OAuth users, skip onboarding by default
            const additionalData = isOAuthUser ? {
              preferences: {
                onboardingCompleted: true
              }
            } : {};
            
            if (isOAuthUser) {
              console.log('🔵 [OAuth] OAuth user detected - setting onboardingCompleted: true');
              // Set completion flag for ProtectedRoute
              sessionStorage.setItem('oauthRedirectCompleted', 'true');
            }
            
            const createdUserData = await createUserDocument(user, additionalData);
            console.log('✅ [OAuth] User data loaded:', createdUserData.email);
            
            // Verify onboarding status was set correctly
            let finalUserData = createdUserData;
            if (isOAuthUser && createdUserData && !createdUserData.onboardingCompleted) {
              // Edge case: onboarding wasn't set during document creation, update explicitly
              try {
                const userRef = doc(db, 'users', user.uid);
                // Use dot notation for nested field update (consistent with codebase pattern)
                await updateDoc(userRef, {
                  onboardingCompleted: true,
                  'preferences.onboardingCompleted': true,
                  updatedAt: serverTimestamp()
                });
                console.log('✅ [OAuth] Set onboardingCompleted on user document (explicit update)');
                
                // Update local data to reflect the change
                const updatedPreferences = {
                  ...(createdUserData.preferences || {}),
                  onboardingCompleted: true
                };
                finalUserData = {
                  ...createdUserData,
                  onboardingCompleted: true,
                  preferences: updatedPreferences
                };
              } catch (updateErr: any) {
                console.warn('⚠️ [OAuth] Could not set onboardingCompleted on user doc (non-fatal):', updateErr);
                // Continue with original data - user is still authenticated
              }
            }
            
            // Update state with final user data
            if (isMounted) {
              setCurrentUser(user);
              setUserData(finalUserData);
              setIsAdmin(finalUserData.isAdmin);
              setUserRole(finalUserData.role || 'volunteer');
              setIsGuest(false);
              setLoading(false);
            }
          } else {
            // No authenticated user
            console.log('ℹ️ [OAuth] No user authenticated, showing welcome screen');
            
            // Clean up OAuth flags
            sessionStorage.removeItem('oauthRedirectCompleted');
            sessionStorage.removeItem('wasillah_oauth_in_progress');
            sessionStorage.removeItem('wasillah_oauth_provider');
            sessionStorage.removeItem('wasillah_oauth_time');
            
            // Update state
            if (isMounted) {
              setCurrentUser(null);
              setUserData(null);
              setIsAdmin(false);
              setLoading(false);
            }
          }
        } catch (err: any) {
          console.error('❌ [OAuth] Error in auth state handling:', err);
          console.error('❌ [OAuth] Error code:', err?.code);
          console.error('❌ [OAuth] Error message:', err?.message);
          
          // Clear flags on error
          sessionStorage.removeItem('oauthRedirectCompleted');
          sessionStorage.removeItem('wasillah_oauth_in_progress');
          sessionStorage.removeItem('wasillah_oauth_provider');
          sessionStorage.removeItem('wasillah_oauth_time');
          
          // Update state to prevent infinite loading
          if (isMounted) {
            setLoading(false);
            setCurrentUser(null);
            setUserData(null);
            setIsAdmin(false);
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