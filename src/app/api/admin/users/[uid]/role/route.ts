import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";

const ROLES = ["student", "mentor", "admin"];

export async function POST(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { uid } = await params;
  const { role } = await req.json().catch(() => ({}));
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  if (uid === gate.uid) {
    return NextResponse.json({ error: "you can't change your own role" }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const target = await adminAuth.getUser(uid).catch(() => null);
  if (!target) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  await adminAuth.setCustomUserClaims(uid, { ...target.customClaims, role });
  await getAdminDb().collection("users").doc(uid).set({ role }, { merge: true });
  // The new role applies to the target's session cookie on their next sign-in.
  return NextResponse.json({ ok: true });
}
