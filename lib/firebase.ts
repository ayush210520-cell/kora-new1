// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsQioYdGm_n0Aco6nC6wuD1jmZkn-S_dU",
  authDomain: "korakaz-303b1.firebaseapp.com",
  projectId: "korakaz-303b1",
  storageBucket: "korakaz-303b1.firebasestorage.app",
  messagingSenderId: "643945179113",
  appId: "1:643945179113:web:51f717f2e8a4aa0e3f0d78",
  measurementId: "G-M8RML4ZSYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    // Temporarily disable analytics to fix permission issues
    // analytics = getAnalytics(app);
    console.log('📊 Firebase Analytics temporarily disabled to fix permission issues');
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Google Auth Provider with proper configuration
export const googleProvider = new GoogleAuthProvider();

// Add scopes and custom parameters to fix "Access blocked" error
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});

// Force popup mode
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline',
  display: 'popup'
});

// Firebase Auth Functions - Enhanced popup method with better error handling
export const signInWithGoogle = async () => {
  try {
    console.log('🔍 Starting Google authentication...');
    console.log('📍 Current domain:', window.location.origin);
    console.log('🔧 Firebase config domain:', firebaseConfig.authDomain);
    
    // Force popup method - don't fall back to redirect
    console.log('✅ Using popup method for Google authentication...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('🎉 Google sign-in successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('❌ Google sign-in error:', error);
    console.error('🔍 Error code:', error.code);
    console.error('🔍 Error message:', error.message);
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      console.error('🚫 Popup blocked by browser. Please allow popups for this site.');
      throw new Error('Popup blocked by browser. Please allow popups for this site and try again.');
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error('🚫 Unauthorized domain error. Current domain:', window.location.origin);
      console.error('🚫 Authorized domains should include:', window.location.origin);
      throw new Error('This domain is not authorized for Google sign-in. Please contact support.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    } else if (error.message?.includes('Access blocked')) {
      console.error('🚫 Access blocked error. Check Firebase configuration.');
      throw new Error('Access blocked. Please check your Firebase configuration and try again.');
    }
    
    throw new Error('Google sign-in failed. Please try again.');
  }
};

// Redirect method as fallback (enhanced)
export const signInWithGoogleRedirect = async () => {
  try {
    console.log('Using redirect method for Google authentication...');
    await signInWithRedirect(auth, googleProvider);
    return null;
  } catch (error: any) {
    console.error('Google redirect sign-in error:', error);
    throw new Error('Redirect sign-in failed. Please try again.');
  }
};

// Get redirect result (call this when the page loads after redirect)
export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error: any) {
    console.error('Get redirect result error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export { analytics };
export default app;
