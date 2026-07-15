// Client-side sign-in/sign-up helpers. Each one authenticates with Firebase,
// then exchanges the ID token for an httpOnly session cookie via
// /api/auth/session so server components can see the user.
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

type SessionResponse = { ok?: boolean; needsRefresh?: boolean; error?: string };
type NewUserProfile = { chapterId: string | null; university: string | null };

async function postToken(idToken: string, profile?: NewUserProfile): Promise<SessionResponse> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...profile }),
  });
  return res.json();
}

async function establishSession(user: User, profile?: NewUserProfile): Promise<void> {
  let res = await postToken(await user.getIdToken(), profile);
  if (res.needsRefresh) {
    res = await postToken(await user.getIdToken(true), profile);
  }
  if (!res.ok) throw new Error(res.error ?? "Could not establish session");
}

export async function signUpWithEmail(
  displayName: string,
  email: string,
  password: string,
  profile: NewUserProfile,
) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(cred.user, { displayName });
  await establishSession(cred.user, profile);
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await establishSession(cred.user);
}

export async function signInWithGoogle(profile?: NewUserProfile) {
  const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  await establishSession(cred.user, profile);
}

// Swallows user-not-found so callers can show the same "check your inbox"
// message either way — the form must not reveal which emails have accounts.
export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "auth/user-not-found") throw err;
  }
}

export async function signOutUser() {
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(getFirebaseAuth());
}

// Re-establish the server session cookie from Firebase's persisted browser
// state — IndexedDB outlives the 14-day cookie, so returning users can skip
// the form. Returns true when a fresh session cookie was minted.
export async function restoreSession(): Promise<boolean> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (!auth.currentUser) return false;
  try {
    await establishSession(auth.currentUser);
    return true;
  } catch {
    return false;
  }
}
