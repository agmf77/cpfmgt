'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { ensureLocalDatabaseSeed } from './local-db';

let persistenceEnabled = false;

// IMPORTANT: Using LOCAL DATABASE ONLY - Firestore disabled
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    const services = getSdks(firebaseApp);
    if (typeof window !== 'undefined') {
      enableClientPersistence(services.auth);
      ensureLocalDatabaseSeed();
    }
    return services;
  }

  // If already initialized, return the SDKs with the already initialized App
  const services = getSdks(getApp());
  if (typeof window !== 'undefined') {
    enableClientPersistence(services.auth);
    ensureLocalDatabaseSeed();
  }
  return services;
}

function enableClientPersistence(auth: ReturnType<typeof getAuth>) {
  if (persistenceEnabled || typeof window === 'undefined') {
    return;
  }

  persistenceEnabled = true;

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('Could not enable auth persistence:', error);
  });

  console.log('Using LOCAL DATABASE only - Firestore disabled');
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: null as any  // Firestore disabled - using local database only
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './offline-auth';
export * from './local-db';
export * from './errors';
export * from './error-emitter';
