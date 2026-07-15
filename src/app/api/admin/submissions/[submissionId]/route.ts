import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const gate = await requireApiRole("admin", "mentor");
  if (gate instanceof NextResponse) return gate;

  const { submissionId } = await params;
  const { feedback } = await req.json().catch(() => ({}));
  if (typeof feedback !== "string" || !feedback.trim() || feedback.length > 5000) {
    return NextResponse.json({ error: "feedback must be 1–5000 characters" }, { status: 400 });
  }

  const ref = getAdminDb().collection("submissions").doc(submissionId);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "submission not found" }, { status: 404 });
  }

  await ref.set(
    {
      feedback: feedback.trim(),
      status: "reviewed",
      reviewedBy: gate.uid,
      reviewedAt: Date.now(),
    },
    { merge: true },
  );
  return NextResponse.json({ ok: true });
}
