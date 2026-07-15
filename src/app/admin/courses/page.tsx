import Link from "next/link";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { CourseForm } from "@/components/admin/course-form";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Course } from "@/lib/types";

export default async function AdminCoursesPage() {
  await requireAdminPage();
  const snap = await getAdminDb().collection("courses").orderBy("order").get();
  const courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Course) }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">Courses</h2>
        <ul className="mt-4 space-y-3">
          {courses.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="font-medium text-[#233242] hover:text-primary"
                >
                  {c.order}. {c.title}
                </Link>
                <p className="truncate text-sm text-gray-500">
                  {c.moduleIds.length} module{c.moduleIds.length === 1 ? "" : "s"}
                  {c.description ? ` — ${c.description}` : ""}
                </p>
              </div>
              <DeleteButton url={`/api/admin/courses/${c.id}`} />
            </li>
          ))}
        </ul>
        {courses.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No courses yet — create the first one.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">New course</h2>
        <CourseForm />
      </div>
    </div>
  );
}
