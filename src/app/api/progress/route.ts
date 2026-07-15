import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";

const STATUSES = ["in_progress", "completed"];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { moduleId, status } = await req.json().catch(() => ({}));
  if (typeof moduleId !== "string" || !moduleId) {
    return NextResponse.json({ error: "moduleId required" }, { status: 400 });
  }
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!(await db.collection("modules").doc(moduleId).get()).exists) {
    return NextResponse.json({ error: "module not found" }, { status: 404 });
  }

  await db
    .collection("progress")
    .doc(`${user.uid}_${moduleId}`)
    .set(
      {
        uid: user.uid,
        moduleId,
        status,
        ...(status === "completed" ? { completedAt: Date.now() } : {}),
      },
      { merge: true },
    );

  // Streak: any progress action counts as activity for the day.
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const userRef = db.collection("users").doc(user.uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const streak = snap.data()?.streak ?? { current: 0, longest: 0, lastActiveDate: "" };
    if (streak.lastActiveDate !== today) {
      streak.current = streak.lastActiveDate === yesterday ? streak.current + 1 : 1;
      streak.longest = Math.max(streak.longest, streak.current);
      streak.lastActiveDate = today;
      tx.set(userRef, { streak }, { merge: true });
    }
  });

  return NextResponse.json({ ok: true });
}
