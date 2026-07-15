import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { LectureForm, LectureRow } from "@/components/admin/lecture-form";
import type { Lecture } from "@/lib/types";

export default async function AdminLecturesPage() {
  await requireAdminPage();
  const snap = await getAdminDb().collection("lectures").orderBy("date", "desc").get();
  const lectures = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Lecture) }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">Lectures</h2>
        <ul className="mt-4 space-y-3">
          {lectures.map((l) => (
            <LectureRow key={l.id} id={l.id} lecture={l} />
          ))}
        </ul>
        {lectures.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No lectures yet — add your first one.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">New lecture</h2>
        <div className="mt-4">
          <LectureForm />
        </div>
      </div>
    </div>
  );
}
