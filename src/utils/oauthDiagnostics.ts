/**
 * OAuth Diagnostics Utility
 * Helps debug OAuth login issues
 */

import { auth } from '../config/firebase';
import { getRedirectResult } from 'firebase/auth';

/**
 * Diagnostic function to check OAuth configuration and state
 * Call this from browser console: window.diagnoseOAuth()
 */
export async function diagnoseOAuth(): Promise<void> {
  console.log('🔍 === OAuth Diagnostics ===\n');
  
  // 1. Check current URL
  console.log('1. Current URL:', window.location.href);
  console.log('   Hostname:', window.location.hostname);
  console.log('   Path:', window.location.pathname);
  console.log('   Search:', window.location.search);
  console.log('   Hash:', window.location.hash);
  
  // 2. Check URL parameters for OAuth
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || 
                        hashParams.has('code') || hashParams.has('state');
  console.log('\n2. OAuth Parameters in URL:', hasOAuthParams);
  if (hasOAuthParams) {
    console.log('   URL Params:', Object.fromEntries(urlParams));
    console.log('   Hash Params:', Object.fromEntries(hashParams));
  }
  
  // 3. Check Firebase Auth configuration
  console.log('\n3. Firebase Auth Configuration:');
  console.log('   App name:', auth.app.name);
  console.log('   Current hostname:', window.location.hostname);
  console.log('   Current origin:', window.location.origin);
  
  // Try to get config from app options
  try {
    const app = auth.app;
    const config = (app as any).options;
    if (config) {
      console.log('   Auth Domain:', config.authDomain || 'not set');
      console.log('   Project ID:', config.projectId || 'not set');
      console.log('   API Key:', config.apiKey ? '***' + config.apiKey.slice(-4) : 'not set');
    }
  } catch (e) {
    console.log('   (Config not accessible)');
  }
  
  // 4. Check current auth state
  console.log('\n4. Current Auth State:');
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log('   ✅ User authenticated:', currentUser.email);
    console.log('   UID:', currentUser.uid);
    console.log('   Providers:', currentUser.providerData.map(p => p.providerId).join(', '));
  } else {
    console.log('   ❌ No user authenticated');
  }
  
  // 5. Check redirect result
  console.log('\n5. Checking redirect result...');
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('   ✅ Redirect result found');
      console.log('   User:', result.user?.email);
      console.log('   Provider:', result.providerId);
      console.log('   Operation:', result.operationType);
    } else {
      console.log('   ℹ️ No redirect result (normal page load)');
    }
  } catch (error: any) {
    console.log('   ❌ Error getting redirect result:', error.message);
    console.log('   Error code:', error.code);
  }
  
  // 6. Check sessionStorage flags
  console.log('\n6. SessionStorage Flags:');
  console.log('   oauthRedirectCompleted:', sessionStorage.getItem('oauthRedirectCompleted'));
  console.log('   oauthRedirectInitiated:', sessionStorage.getItem('oauthRedirectInitiated'));
  console.log('   oauthRedirectTime:', sessionStorage.getItem('oauthRedirectTime'));
  
  // 7. Check Firebase Console Configuration (instructions)
  console.log('\n7. Firebase Console Configuration Checklist:');
  console.log('   ⚠️  Please verify in Firebase Console:');
  console.log('   - Go to: Firebase Console > Authentication > Settings > Authorized domains');
  console.log('   - Ensure these domains are authorized:');
  console.log('     * localhost (for development)');
  console.log('     *', window.location.hostname, '(current domain)');
  console.log('     * Your production domain');
  console.log('   - Go to: Authentication > Sign-in method > Google');
  console.log('   - Ensure Google sign-in is enabled');
  console.log('   - Check OAuth redirect URIs are configured');
  
  // 8. Browser checks
  console.log('\n8. Browser Checks:');
  console.log('   Third-party cookies:', navigator.cookieEnabled ? 'Enabled' : 'Disabled');
  console.log('   User agent:', navigator.userAgent);
  
  console.log('\n✅ Diagnostics complete. Review the output above for issues.\n');
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).diagnoseOAuth = diagnoseOAuth;
  (window as any).diagnoseFirebase = diagnoseOAuth; // Alias for compatibility
}

export default diagnoseOAuth;

