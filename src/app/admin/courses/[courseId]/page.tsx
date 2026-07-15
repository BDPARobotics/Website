import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { CourseEditForm } from "@/components/admin/course-edit-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { ModuleCreateForm } from "@/components/admin/module-create-form";
import type { Course, Module } from "@/lib/types";

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireAdminPage();
  const { courseId } = await params;
  const db = getAdminDb();

  const courseSnap = await db.collection("courses").doc(courseId).get();
  if (!courseSnap.exists) notFound();
  const course = courseSnap.data() as Course;

  // Sorted in memory to avoid needing a composite index (courseId + order),
  // which the service account lacks permission to create.
  const modulesSnap = await db.collection("modules").where("courseId", "==", courseId).get();
  const modules = modulesSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Module) }))
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <Link href="/admin/courses" className="text-sm text-gray-400 hover:text-primary">
        ← All courses
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#233242]">{course.title}</h2>
          {course.description && <p className="mt-1 text-sm text-gray-500">{course.description}</p>}
        </div>
        <CourseEditForm
          courseId={courseId}
          initialTitle={course.title}
          initialDescription={course.description}
          initialOrder={course.order}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="text-lg font-semibold text-[#233242]">Modules</h3>
          <ul className="mt-4 space-y-3">
            {modules.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/modules/${m.id}`}
                    className="font-medium text-[#233242] hover:text-primary"
                  >
                    {m.order}. {m.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {m.type === "arm_challenge" ? "Robot arm challenge" : "Content"} ·{" "}
                    {m.contentBlocks.length} block{m.contentBlocks.length === 1 ? "" : "s"}
                    {m.aiContext ? "" : " · no AI context yet"}
                  </p>
                </div>
                <DeleteButton url={`/api/admin/modules/${m.id}`} />
              </li>
            ))}
          </ul>
          {modules.length === 0 && (
            <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No modules yet.
            </p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#233242]">New module</h3>
          <ModuleCreateForm courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
