import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { validateEventBody } from "@/lib/events";

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { eventId } = await params;
  const body = await req.json().catch(() => ({}));
  const errors = validateEventBody(body);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const ref = getAdminDb().collection("events").doc(eventId);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }
  await ref.set(
    {
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() : "",
      date: body.date,
      type: body.type,
      time: body.time?.trim() || null,
      location: body.location?.trim() || null,
      link: body.link?.trim() || null,
    },
    { merge: true },
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { eventId } = await params;
  await getAdminDb().collection("events").doc(eventId).delete();
  return NextResponse.json({ ok: true });
}
