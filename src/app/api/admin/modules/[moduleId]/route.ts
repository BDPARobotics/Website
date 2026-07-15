import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { deleteModuleData } from "@/lib/firebase/cascade";
import { requireApiRole } from "@/lib/auth/guards";
import type { ContentBlock, ModuleType } from "@/lib/types";

const MODULE_TYPES: ModuleType[] = ["content", "arm_challenge"];
const BLOCK_TYPES = ["text", "code", "image", "video", "pdf"];

function sanitizeBlocks(blocks: unknown): ContentBlock[] | null {
  if (!Array.isArray(blocks)) return null;
  const clean: ContentBlock[] = [];
  for (const b of blocks) {
    if (!b || typeof b !== "object" || !BLOCK_TYPES.includes(b.type)) return null;
    if (b.type === "text" || b.type === "code") {
      if (typeof b.content !== "string") return null;
      clean.push(
        b.type === "code"
          ? { type: "code", content: b.content, language: typeof b.language === "string" ? b.language : undefined }
          : { type: "text", content: b.content },
      );
    } else {
      if (typeof b.url !== "string") return null;
      if (b.type === "image") {
        clean.push({ type: "image", url: b.url, alt: typeof b.alt === "string" ? b.alt : undefined });
      } else {
        clean.push({ type: b.type, url: b.url });
      }
    }
  }
  return clean;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { moduleId } = await params;
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (Number.isFinite(Number(body.order))) update.order = Number(body.order);
  if (MODULE_TYPES.includes(body.type)) update.type = body.type;
  if (typeof body.aiContext === "string") update.aiContext = body.aiContext;
  if (body.contentBlocks !== undefined) {
    const blocks = sanitizeBlocks(body.contentBlocks);
    if (blocks === null) {
      return NextResponse.json({ error: "invalid contentBlocks" }, { status: 400 });
    }
    update.contentBlocks = blocks;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  await getAdminDb().collection("modules").doc(moduleId).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { moduleId } = await params;
  const db = getAdminDb();
  const ref = db.collection("modules").doc(moduleId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "module not found" }, { status: 404 });
  }
  const courseId = snap.data()?.courseId;
  await ref.delete();
  await deleteModuleData(db, moduleId);
  if (courseId) {
    await db.collection("courses").doc(courseId).update({ moduleIds: FieldValue.arrayRemove(moduleId) });
  }
  return NextResponse.json({ ok: true });
}
