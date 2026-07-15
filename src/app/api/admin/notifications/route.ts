import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import type { Notification } from "@/lib/types";

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { title, body: message, link } = await req.json().catch(() => ({}));
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const notification: Notification = {
    title: title.trim(),
    body: message.trim(),
    ...(typeof link === "string" && link.trim() ? { link: link.trim() } : {}),
    createdBy: gate.uid,
    createdAt: Date.now(),
  };
  const ref = await getAdminDb().collection("notifications").add(notification);
  return NextResponse.json({ id: ref.id });
}
