import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { validateWinnerBody } from "@/lib/winners";
import type { Winner } from "@/lib/types";

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => ({}));
  const errors = validateWinnerBody(body);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const winner: Winner = {
    year: Number(body.year),
    place: body.place.trim(),
    teamName: body.teamName.trim(),
    ...(body.challenge?.trim() ? { challenge: body.challenge.trim() } : {}),
    ...(body.chapter?.trim() ? { chapter: body.chapter.trim() } : {}),
    ...(body.members?.trim() ? { members: body.members.trim() } : {}),
    ...(body.photoUrl?.trim() ? { photoUrl: body.photoUrl.trim() } : {}),
    ...(body.description?.trim() ? { description: body.description.trim() } : {}),
    createdAt: Date.now(),
  };
  const ref = await getAdminDb().collection("winners").add(winner);
  return NextResponse.json({ id: ref.id });
}
