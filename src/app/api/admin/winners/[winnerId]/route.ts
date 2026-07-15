import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { validateWinnerBody } from "@/lib/winners";

export async function PATCH(req: Request, { params }: { params: Promise<{ winnerId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { winnerId } = await params;
  const body = await req.json().catch(() => ({}));
  const errors = validateWinnerBody(body);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const ref = getAdminDb().collection("winners").doc(winnerId);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "winner not found" }, { status: 404 });
  }
  await ref.set(
    {
      year: Number(body.year),
      place: body.place.trim(),
      teamName: body.teamName.trim(),
      challenge: body.challenge?.trim() || null,
      chapter: body.chapter?.trim() || null,
      members: body.members?.trim() || null,
      photoUrl: body.photoUrl?.trim() || null,
      description: body.description?.trim() || null,
    },
    { merge: true },
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ winnerId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { winnerId } = await params;
  await getAdminDb().collection("winners").doc(winnerId).delete();
  return NextResponse.json({ ok: true });
}
