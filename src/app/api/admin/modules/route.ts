import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import type { Module, ModuleType } from "@/lib/types";

const MODULE_TYPES: ModuleType[] = ["content", "arm_challenge"];

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { courseId, title, order, type } = await req.json().catch(() => ({}));
  if (typeof courseId !== "string" || !courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const db = getAdminDb();
  const courseRef = db.collection("courses").doc(courseId);
  if (!(await courseRef.get()).exists) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }

  const moduleDoc: Module = {
    courseId,
    title: title.trim(),
    order: Number.isFinite(Number(order)) ? Number(order) : 0,
    type: MODULE_TYPES.includes(type) ? type : "content",
    contentBlocks: [],
    aiContext: "",
  };
  const ref = await db.collection("modules").add(moduleDoc);
  await courseRef.update({ moduleIds: FieldValue.arrayUnion(ref.id) });
  return NextResponse.json({ id: ref.id });
}
