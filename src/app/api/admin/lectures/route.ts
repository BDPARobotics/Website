import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { validateLectureBody } from "@/lib/lectures";
import type { Lecture } from "@/lib/types";

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => ({}));
  const errors = validateLectureBody(body);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const lecture: Lecture = {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : "",
    date: body.date,
    ...(body.recordingUrl?.trim() ? { recordingUrl: body.recordingUrl.trim() } : {}),
    ...(body.slidesUrl?.trim() ? { slidesUrl: body.slidesUrl.trim() } : {}),
    createdAt: Date.now(),
  };
  const ref = await getAdminDb().collection("lectures").add(lecture);
  return NextResponse.json({ id: ref.id });
}
