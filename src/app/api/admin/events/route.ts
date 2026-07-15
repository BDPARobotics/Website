import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { validateEventBody } from "@/lib/events";
import type { CalendarEvent } from "@/lib/types";

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => ({}));
  const errors = validateEventBody(body);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const event: CalendarEvent = {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : "",
    date: body.date,
    type: body.type,
    ...(body.time?.trim() ? { time: body.time.trim() } : {}),
    ...(body.location?.trim() ? { location: body.location.trim() } : {}),
    ...(body.link?.trim() ? { link: body.link.trim() } : {}),
    createdAt: Date.now(),
  };
  const ref = await getAdminDb().collection("events").add(event);
  return NextResponse.json({ id: ref.id });
}
