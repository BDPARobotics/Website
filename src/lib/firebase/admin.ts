import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Lazy init so builds and pages that never touch Firebase don't require the
// service account key to be present.
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase console → Project settings → Service accounts → Generate new private key, then paste the JSON (single line) into .env.local.",
    );
  }
  return initializeApp({ credential: cert(JSON.parse(key)) });
}

export function getAdminAuth(): Auth {
  return getAuth(adminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(adminApp());
}
