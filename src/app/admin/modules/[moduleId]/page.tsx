import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { ModuleEditor } from "@/components/admin/module-editor";
import type { Module } from "@/lib/types";

export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  await requireAdminPage();
  const { moduleId } = await params;

  const snap = await getAdminDb().collection("modules").doc(moduleId).get();
  if (!snap.exists) notFound();
  const moduleDoc = snap.data() as Module;

  return (
    <div>
      <Link
        href={`/admin/courses/${moduleDoc.courseId}`}
        className="text-sm text-gray-400 hover:text-primary"
      >
        ← Back to course
      </Link>
      <ModuleEditor moduleId={moduleId} initial={moduleDoc} />
    </div>
  );
}
