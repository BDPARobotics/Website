import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy init, mirroring lib/firebase/admin.ts: these are client-only (auth,
// browser Firestore/Storage). Initializing eagerly at module scope used to
// run on the server too — a "use client" page still gets evaluated once for
// SSR/build — which crashed the whole build (auth/invalid-api-key) if the
// NEXT_PUBLIC_ env wasn't resolved in that context. Deferring to call time
// means these only ever run from a browser event handler/effect.
function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(firebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(firebaseApp());
}

// Analytics is browser-only and not supported in all environments (SSR,
// some in-app browsers). Call from a client component effect.
export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(firebaseApp()) : null;
}
