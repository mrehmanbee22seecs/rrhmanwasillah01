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
import { auth, googleProvider, facebookProvider, db } from '../config/firebase';
import { initializeUserProfile, logActivity as logUserActivity } from '../utils/firebaseInit';
import { sendWelcomeEmail } from '../services/mailerSendEmailService';
import { UserProfile, UserRole, OnboardingData, ActivityLog } from '../types/user';

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
          onboardingCompleted: false,
          profileCompletionPercentage: 0,
          ...additionalData,
          // Ensure preferences with defaults, merge if additionalData has preferences
          preferences: {
            theme: 'wasilah-classic',
            language: 'en',
            ...additionalData.preferences,
            onboardingCompleted: additionalData.preferences?.onboardingCompleted || false
          }
        };

        console.log('Writing new user document to Firestore...');
        await setDoc(userRef, userData);
        console.log('✅ User document created successfully');
        
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
      console.log('🔵 [OAuth Debug] Starting Google login redirect...');
      console.log('🔵 [OAuth Debug] Current URL before redirect:', window.location.href);
      console.log('🔵 [OAuth Debug] Current hostname:', window.location.hostname);
      console.log('🔵 [OAuth Debug] App name:', auth.app.name);
      
      // Set a flag before redirect to track the attempt
      sessionStorage.setItem('oauthRedirectInitiated', 'true');
      sessionStorage.setItem('oauthRedirectTime', Date.now().toString());
      
      // Use redirect instead of popup to avoid COOP issues
      await signInWithRedirect(auth, googleProvider);
      
      // This line typically won't execute due to redirect, but log if it does
      console.log('🔵 [OAuth Debug] Redirect initiated (this may not log if redirect is immediate)');
      
      // User will be handled by getRedirectResult in useEffect
    } catch (error: any) {
      console.error('❌ [OAuth Debug] Error during Google login redirect:', error);
      console.error('❌ [OAuth Debug] Error code:', error?.code);
      console.error('❌ [OAuth Debug] Error message:', error?.message);
      
      // Clear flags on error
      sessionStorage.removeItem('oauthRedirectInitiated');
      sessionStorage.removeItem('oauthRedirectTime');
      
      // Check for specific errors
      if (error?.code === 'auth/unauthorized-domain') {
        const errorMsg = `Unauthorized domain. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains`;
        console.error('❌ [OAuth Debug]', errorMsg);
        throw new Error(errorMsg);
      }
      
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    try {
      console.log('🔵 Starting Facebook login redirect...');
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
        // Check for redirect result first (from Google/Facebook login)
        console.log('🔍 [OAuth Debug] Checking for redirect result...');
        console.log('🔍 [OAuth Debug] Current URL:', window.location.href);
        console.log('🔍 [OAuth Debug] URL Hash:', window.location.hash);
        console.log('🔍 [OAuth Debug] URL Search:', window.location.search);
        
        // Check if we're coming from an OAuth redirect by examining URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || 
                              hashParams.has('code') || hashParams.has('state') ||
                              urlParams.has('access_token') || hashParams.has('access_token');
        
        if (hasOAuthParams) {
          console.log('🔍 [OAuth Debug] OAuth parameters detected in URL');
          console.log('🔍 [OAuth Debug] URL Params:', Object.fromEntries(urlParams));
          console.log('🔍 [OAuth Debug] Hash Params:', Object.fromEntries(hashParams));
        }
        
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('✅ [OAuth Debug] Redirect result received');
          console.log('✅ [OAuth Debug] User:', result.user?.email);
          console.log('✅ [OAuth Debug] Provider:', result.providerId);
          console.log('✅ [OAuth Debug] Operation Type:', result.operationType);
          
          if (result.user) {
            // User signed in via redirect - create/update their document
            console.log('✅ User authenticated via redirect:', result.user.email);
            oauthLoginDetected = true;
            
            // Set a flag in sessionStorage to indicate OAuth redirect just completed
            // This will help us skip onboarding and go directly to dashboard
            sessionStorage.setItem('oauthRedirectCompleted', 'true');
            console.log('✅ OAuth redirect flag set in sessionStorage');
            
            // The onAuthStateChanged listener below will handle the rest
          } else {
            console.warn('⚠️ [OAuth Debug] Redirect result exists but no user object');
          }
        } else {
          console.log('ℹ️ [OAuth Debug] No redirect result (normal page load)');
          
          // Check if user is actually authenticated (fallback)
          const currentAuthUser = auth.currentUser;
          if (currentAuthUser) {
            console.log('🔍 [OAuth Debug] User is authenticated via auth.currentUser:', currentAuthUser.email);
            console.log('🔍 [OAuth Debug] This might be a redirect that was already processed');
            // Don't clear OAuth flag if user is authenticated - might be from previous redirect
          } else {
            // Clear any stale OAuth flag on normal page load with no user
            sessionStorage.removeItem('oauthRedirectCompleted');
          }
        }
      } catch (error: any) {
        console.error('❌ [OAuth Debug] Error handling redirect result:', error);
        console.error('❌ [OAuth Debug] Error code:', error?.code);
        console.error('❌ [OAuth Debug] Error message:', error?.message);
        console.error('❌ [OAuth Debug] Error stack:', error?.stack);
        
        // Check for specific Firebase auth errors
        if (error?.code === 'auth/redirect-cancelled-by-user') {
          console.error('❌ [OAuth Debug] User cancelled the redirect');
        } else if (error?.code === 'auth/popup-closed-by-user') {
          console.error('❌ [OAuth Debug] Popup was closed (but we use redirect, not popup)');
        } else if (error?.code === 'auth/unauthorized-domain') {
          console.error('❌ [OAuth Debug] UNAUTHORIZED DOMAIN - Check Firebase Console > Authentication > Settings > Authorized domains');
          console.error('❌ [OAuth Debug] Current domain:', window.location.hostname);
        }
        
        // Clear flag on error to prevent stuck states
        sessionStorage.removeItem('oauthRedirectCompleted');
        // Continue to set up auth listener even if redirect fails
      }

      // Set up auth state listener (will catch redirect auth automatically)
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        console.log('🔍 [OAuth Debug] Auth state changed. User:', user ? user.email : 'null');
        console.log('🔍 [OAuth Debug] User provider:', user?.providerData?.map(p => p.providerId).join(', ') || 'none');
        console.log('🔍 [OAuth Debug] User UID:', user?.uid || 'none');
        
        try {
          if (user) {
            // Check if this might be from an OAuth redirect that wasn't caught
            const oauthRedirectInitiated = sessionStorage.getItem('oauthRedirectInitiated') === 'true';
            const redirectTime = sessionStorage.getItem('oauthRedirectTime');
            const timeSinceRedirect = redirectTime ? Date.now() - parseInt(redirectTime) : null;
            
            // If OAuth was initiated recently (within 5 minutes) and user is authenticated,
            // treat it as OAuth login even if getRedirectResult didn't catch it
            const recentOAuthRedirect = oauthRedirectInitiated && timeSinceRedirect && timeSinceRedirect < 300000;
            
            if (recentOAuthRedirect) {
              console.log('🔍 [OAuth Debug] Recent OAuth redirect detected (within 5 minutes)');
              console.log('🔍 [OAuth Debug] Time since redirect:', Math.round(timeSinceRedirect / 1000), 'seconds');
            }
            
            // Check if user signed in with Google/Facebook provider
            const isOAuthProvider = user.providerData.some(
              provider => provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
            );
            
            if (isOAuthProvider) {
              console.log('🔍 [OAuth Debug] User authenticated via OAuth provider:', 
                user.providerData.find(p => p.providerId === 'google.com' || p.providerId === 'facebook.com')?.providerId
              );
            }
            
            // User is authenticated, fetch/create their data
            console.log('🔍 [OAuth Debug] Creating/updating user document...');
            
            // Check sessionStorage as backup in case oauthLoginDetected wasn't captured
            // Also check for recent OAuth redirect or OAuth provider
            const sessionOAuthFlag = sessionStorage.getItem('oauthRedirectCompleted') === 'true';
            const isOAuthUser = oauthLoginDetected || sessionOAuthFlag || (recentOAuthRedirect && isOAuthProvider);
            
            if (isOAuthUser && !sessionOAuthFlag) {
              // Set the flag if we detected OAuth but it wasn't set
              sessionStorage.setItem('oauthRedirectCompleted', 'true');
              console.log('🔍 [OAuth Debug] OAuth flag set from fallback detection');
            }
            
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
            
            // Clean up OAuth redirect tracking flags
            sessionStorage.removeItem('oauthRedirectInitiated');
            sessionStorage.removeItem('oauthRedirectTime');
            
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
            console.log('ℹ️ [OAuth Debug] No user authenticated, showing welcome screen');
            
            // Clean up OAuth flags when user logs out
            sessionStorage.removeItem('oauthRedirectCompleted');
            sessionStorage.removeItem('oauthRedirectInitiated');
            sessionStorage.removeItem('oauthRedirectTime');
            
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
        } catch (error: any) {
          console.error('❌ [OAuth Debug] Error in auth state change:', error);
          console.error('❌ [OAuth Debug] Error code:', error?.code);
          console.error('❌ [OAuth Debug] Error message:', error?.message);
          console.error('❌ [OAuth Debug] Error stack:', error?.stack);
          
          // Clear OAuth flag on error
          sessionStorage.removeItem('oauthRedirectCompleted');
          sessionStorage.removeItem('oauthRedirectInitiated');
          sessionStorage.removeItem('oauthRedirectTime');
          
          // Even on error, stop loading to prevent infinite spinner
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