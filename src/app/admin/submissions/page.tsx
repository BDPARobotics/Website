import Link from "next/link";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import type { Submission } from "@/lib/types";

export default async function AdminSubmissionsPage() {
  await requireAdminPage();
  const db = getAdminDb();
  const snap = await db.collection("submissions").orderBy("submittedAt", "desc").limit(100).get();
  const submissions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Submission) }));

  // Resolve student + module names for the listing.
  const uids = [...new Set(submissions.map((s) => s.uid))];
  const moduleIds = [...new Set(submissions.map((s) => s.moduleId))];
  const [userSnaps, moduleSnaps] = await Promise.all([
    Promise.all(uids.map((u) => db.collection("users").doc(u).get())),
    Promise.all(moduleIds.map((m) => db.collection("modules").doc(m).get())),
  ]);
  const names = new Map(userSnaps.map((s) => [s.id, s.data()?.displayName ?? s.id]));
  const moduleTitles = new Map(moduleSnaps.map((s) => [s.id, s.data()?.title ?? "(deleted module)"]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="py-3 pr-4">Student</th>
            <th className="py-3 pr-4">Challenge</th>
            <th className="py-3 pr-4">Attempt</th>
            <th className="py-3 pr-4">Language</th>
            <th className="py-3 pr-4">Submitted</th>
            <th className="py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-[#233242]">
                <Link href={`/admin/submissions/${s.id}`} className="hover:text-primary">
                  {names.get(s.uid)}
                </Link>
              </td>
              <td className="py-3 pr-4 text-gray-600">{moduleTitles.get(s.moduleId)}</td>
              <td className="py-3 pr-4 text-gray-600">#{s.attemptNum}</td>
              <td className="py-3 pr-4 text-gray-600">{s.language}</td>
              <td className="py-3 pr-4 text-gray-600">
                {new Date(s.submittedAt).toLocaleString()}
              </td>
              <td className="py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "reviewed"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {s.status === "reviewed" ? "Reviewed" : "Needs review"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {submissions.length === 0 && (
        <p className="py-10 text-center text-gray-500">No submissions yet.</p>
      )}
    </div>
  );
}
