'use client';

/**
 * FIREBASE INTERNAL MODULE GATEWAY
 * 
 * This file acts as the "Main Switchboard" for the app's database and security.
 * It imports the complex logic from the 'firebase' node_module and provides 
 * simplified tools (SDKs) for the rest of the application.
 */

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Initialize the Firebase connection. This only runs once.
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Standard Firebase initialization
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase connection failed:', e);
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

// Export the specific tools we need (Auth and Firestore)
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// Re-export other internal tools so they can be imported from this "module"
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
