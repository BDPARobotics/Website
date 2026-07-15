import "server-only";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/lib/types";

const SESSION_COOKIE = "__session";
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// Exchange a client-side Firebase ID token for an httpOnly session cookie.
// Call from the sign-in route handler.
export async function createSession(idToken: string): Promise<void> {
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
  (await cookies()).set(SESSION_COOKIE, sessionCookie, {
    maxAge: SESSION_DURATION_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export type SessionUser = DecodedIdToken & { role?: Role };

// Returns the verified user for the current request, or null if signed out.
// checkRevoked hits the Auth server; fine at this scale, revisit if it shows
// up in latency traces.
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    return await getAdminAuth().verifySessionCookie(session, true);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.role || !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
