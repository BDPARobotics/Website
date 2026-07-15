import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { SUBMISSION_LANGUAGES, type Module, type Submission } from "@/lib/types";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const moduleId = new URL(req.url).searchParams.get("moduleId");
  if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });

  // Equality-only filter (no composite index needed); sort in memory.
  const snap = await getAdminDb()
    .collection("submissions")
    .where("uid", "==", user.uid)
    .where("moduleId", "==", moduleId)
    .get();
  const submissions = snap.docs
    .map((d) => d.data() as Submission)
    .sort((a, b) => b.attemptNum - a.attemptNum);
  return NextResponse.json({ submissions });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { moduleId, language, code, notes, videoUrl } = body;
  if (typeof moduleId !== "string" || !moduleId) {
    return NextResponse.json({ error: "moduleId required" }, { status: 400 });
  }
  if (!SUBMISSION_LANGUAGES.includes(language)) {
    return NextResponse.json({ error: "invalid language" }, { status: 400 });
  }
  if (typeof code !== "string" || !code.trim() || code.length > 60_000) {
    return NextResponse.json({ error: "code must be 1–60000 characters" }, { status: 400 });
  }
  if (videoUrl !== undefined && (typeof videoUrl !== "string" || videoUrl.length > 500)) {
    return NextResponse.json({ error: "invalid videoUrl" }, { status: 400 });
  }

  const db = getAdminDb();
  const moduleSnap = await db.collection("modules").doc(moduleId).get();
  if (!moduleSnap.exists) {
    return NextResponse.json({ error: "module not found" }, { status: 404 });
  }
  if ((moduleSnap.data() as Module).type !== "arm_challenge") {
    return NextResponse.json({ error: "this module does not accept submissions" }, { status: 400 });
  }

  const prior = await db
    .collection("submissions")
    .where("uid", "==", user.uid)
    .where("moduleId", "==", moduleId)
    .get();
  const attemptNum = prior.size + 1;

  const submission: Submission = {
    uid: user.uid,
    moduleId,
    attemptNum,
    language,
    code,
    ...(typeof notes === "string" && notes.trim() ? { notes: notes.trim().slice(0, 2000) } : {}),
    ...(typeof videoUrl === "string" && videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
    status: "submitted",
    submittedAt: Date.now(),
  };
  await db.collection("submissions").doc(`${user.uid}_${moduleId}_${attemptNum}`).set(submission);

  // First submission also marks the module as started.
  const progressRef = db.collection("progress").doc(`${user.uid}_${moduleId}`);
  if (!(await progressRef.get()).exists) {
    await progressRef.set({ uid: user.uid, moduleId, status: "in_progress" });
  }

  return NextResponse.json({ ok: true, attemptNum });
}
