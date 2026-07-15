import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { clearSession, createSession } from "@/lib/auth/session";
import { logNotification, sendEmail, welcomeEmail } from "@/lib/email";
import type { UserDoc } from "@/lib/types";

export async function POST(req: Request) {
  const { idToken, chapterId, university } = await req.json().catch(() => ({}));
  if (typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken required" }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const profile = {
    chapterId: typeof chapterId === "string" && chapterId ? chapterId : null,
    university: typeof university === "string" && university.trim() ? university.trim() : null,
  };

  // First sign-in: stamp the role claim, then have the client refresh its ID
  // token and call again so the session cookie carries the claim.
  if (!decoded.role) {
    await adminAuth.setCustomUserClaims(decoded.uid, { role: "student" });
    await welcomeIfNew(decoded.uid, decoded.name, decoded.email, profile);
    return NextResponse.json({ needsRefresh: true });
  }

  await welcomeIfNew(decoded.uid, decoded.name, decoded.email, profile);
  await createSession(idToken);
  return NextResponse.json({ ok: true, role: decoded.role });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

// Creates the user doc on first sign-in and fires the welcome email exactly once.
async function welcomeIfNew(
  uid: string,
  name?: string,
  email?: string,
  profile?: { chapterId: string | null; university: string | null },
) {
  const created = await ensureUserDoc(uid, name, email, profile);
  if (!created || !email) return;
  const { subject, html } = welcomeEmail(name ?? email.split("@")[0]);
  const result = await sendEmail({ to: email, subject, html });
  if (result.id) await logNotification(uid, "welcome", result.id);
  else console.error("welcome email failed:", result.error);
}

async function ensureUserDoc(
  uid: string,
  name?: string,
  email?: string,
  profile?: { chapterId: string | null; university: string | null },
): Promise<boolean> {
  try {
    const ref = getAdminDb().collection("users").doc(uid);
    if ((await ref.get()).exists) return false;
    const doc: UserDoc = {
      role: "student",
      chapterId: profile?.chapterId ?? null,
      university: profile?.university ?? null,
      displayName: name ?? email?.split("@")[0] ?? "Student",
      email: email ?? "",
      badgeIds: [],
      streak: { current: 0, longest: 0, lastActiveDate: "" },
      createdAt: Date.now(),
    };
    await ref.set(doc);
    return true;
  } catch (err) {
    // Auth still works if Firestore isn't provisioned yet; the doc gets
    // created on a later sign-in instead.
    console.error("ensureUserDoc failed:", err);
    return false;
  }
}
