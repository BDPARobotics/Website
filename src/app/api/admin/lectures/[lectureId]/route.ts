import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { validateLectureBody } from "@/lib/lectures";

export async function PATCH(req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { lectureId } = await params;
  const body = await req.json().catch(() => ({}));
  const errors = validateLectureBody(body);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const ref = getAdminDb().collection("lectures").doc(lectureId);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "lecture not found" }, { status: 404 });
  }
  await ref.set(
    {
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() : "",
      date: body.date,
      recordingUrl: body.recordingUrl?.trim() || null,
      slidesUrl: body.slidesUrl?.trim() || null,
    },
    { merge: true },
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { lectureId } = await params;
  await getAdminDb().collection("lectures").doc(lectureId).delete();
  return NextResponse.json({ ok: true });
}
