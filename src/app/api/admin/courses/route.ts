import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/auth/guards";
import type { Course } from "@/lib/types";

export async function POST(req: Request) {
  const gate = await requireApiRole("admin");
  if (gate instanceof NextResponse) return gate;

  const { title, description, order } = await req.json().catch(() => ({}));
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const course: Course = {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : "",
    order: Number.isFinite(Number(order)) ? Number(order) : 0,
    moduleIds: [],
  };
  const ref = await getAdminDb().collection("courses").add(course);
  return NextResponse.json({ id: ref.id });
}
