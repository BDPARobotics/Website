import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminBucket } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";

export const maxDuration = 60;

// Supporting documents for module content: rule sheets, wiring diagrams, etc.
const ALLOWED_TYPES: Record<string, true> = {
  "application/pdf": true,
  "application/vnd.ms-powerpoint": true,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
  "image/png": true,
  "image/jpeg": true,
  "image/gif": true,
  "image/webp": true,
  "video/mp4": true,
};
// Vercel caps request bodies at ~4.5MB in production; this is the local ceiling.
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required (multipart form field 'file')" }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: `unsupported type ${file.type} — allowed: PDF, PNG, JPEG, GIF, WebP, MP4` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 20MB, 4.5MB on Vercel)" }, { status: 413 });
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";
  const path = `content/${Date.now()}-${safeName}`;
  const token = randomUUID();

  const bucket = getAdminBucket();
  await bucket.file(path).save(Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    metadata: {
      // Firebase download token → stable, tokenized public URL (same mechanism
      // the Firebase console uses). Storage rules still block listing/writes.
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return NextResponse.json({ url, name: file.name, contentType: file.type });
}
