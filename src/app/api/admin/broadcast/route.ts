import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import { emailShell, escapeHtml, logNotification, sendBatch } from "@/lib/email";
import type { UserDoc } from "@/lib/types";

export const maxDuration = 60;

const AUDIENCES = ["all", "student", "mentor"];

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { subject, message, audience } = await req.json().catch(() => ({}));
  if (typeof subject !== "string" || !subject.trim() || subject.length > 200) {
    return NextResponse.json({ error: "subject must be 1–200 characters" }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 10_000) {
    return NextResponse.json({ error: "message must be 1–10000 characters" }, { status: 400 });
  }
  if (!AUDIENCES.includes(audience)) {
    return NextResponse.json({ error: "audience must be all, student, or mentor" }, { status: 400 });
  }

  const db = getAdminDb();
  let query = db.collection("users") as FirebaseFirestore.Query;
  if (audience !== "all") query = query.where("role", "==", audience);
  const snap = await query.get();

  const recipients = snap.docs
    .map((d) => ({ uid: d.id, ...(d.data() as UserDoc) }))
    .filter((u) => u.email);
  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, note: "no recipients for that audience" });
  }

  const bodyHtml = `<p>${escapeHtml(message.trim()).replace(/\n/g, "<br/>")}</p>`;
  const emails = recipients.map((u) => ({
    to: u.email,
    subject: subject.trim(),
    html: emailShell(
      escapeHtml(subject.trim()),
      `<p>Hi ${escapeHtml(u.displayName || "there")},</p>${bodyHtml}`,
    ),
  }));

  const { ids, errors } = await sendBatch(emails);
  await Promise.all(
    ids.map((id, i) => logNotification(recipients[i]?.uid ?? "unknown", "broadcast", id)),
  );

  return NextResponse.json({
    sent: ids.length,
    failed: recipients.length - ids.length,
    ...(errors.length ? { errors } : {}),
  });
}
