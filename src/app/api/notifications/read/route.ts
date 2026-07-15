import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import type { NotificationRead } from "@/lib/types";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const read: NotificationRead = { lastReadAt: Date.now() };
  await getAdminDb().collection("notification_reads").doc(user.uid).set(read);
  return NextResponse.json({ ok: true });
}
