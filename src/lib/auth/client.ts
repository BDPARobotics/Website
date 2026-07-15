// Client-side sign-in/sign-up helpers. Each one authenticates with Firebase,
// then exchanges the ID token for an httpOnly session cookie via
// /api/auth/session so server components can see the user.
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

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
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await establishSession(cred.user, profile);
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await establishSession(cred.user);
}

export async function signInWithGoogle(profile?: NewUserProfile) {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  await establishSession(cred.user, profile);
}

export async function signOutUser() {
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(auth);
}
