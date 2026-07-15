import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { deleteModuleData } from "@/lib/firebase/cascade";
import { requireApiRole } from "@/lib/auth/guards";

export async function PATCH(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { courseId } = await params;
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.description === "string") update.description = body.description.trim();
  if (Number.isFinite(Number(body.order))) update.order = Number(body.order);
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  await getAdminDb().collection("courses").doc(courseId).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { courseId } = await params;
  const db = getAdminDb();
  const modules = await db.collection("modules").where("courseId", "==", courseId).get();
  const batch = db.batch();
  modules.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection("courses").doc(courseId));
  await batch.commit();
  for (const d of modules.docs) {
    await deleteModuleData(db, d.id);
  }
  return NextResponse.json({ ok: true, deletedModules: modules.size });
}
