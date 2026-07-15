import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { notificationId } = await params;
  await getAdminDb().collection("notifications").doc(notificationId).delete();
  return NextResponse.json({ ok: true });
}
