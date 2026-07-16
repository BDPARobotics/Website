import Link from "next/link";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import type { ChatSession } from "@/lib/types";

export default async function AdminChatsPage() {
  await requireAdminPage();
  const db = getAdminDb();
  const snap = await db.collection("chat_sessions").orderBy("updatedAt", "desc").limit(100).get();
  const sessions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ChatSession) }));

  // Resolve student + module names for the listing.
  const uids = [...new Set(sessions.map((s) => s.uid))];
  const moduleIds = [...new Set(sessions.map((s) => s.moduleId))];
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
            <th className="py-3 pr-4">Module</th>
            <th className="py-3 pr-4">Messages</th>
            <th className="py-3 pr-4">Last activity</th>
            <th className="py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-[#233242]">
                <Link href={`/admin/chats/${s.id}`} className="hover:text-primary">
                  {names.get(s.uid)}
                </Link>
              </td>
              <td className="py-3 pr-4 text-gray-600">{moduleTitles.get(s.moduleId)}</td>
              <td className="py-3 pr-4 text-gray-600">{s.messages?.length ?? 0}</td>
              <td className="py-3 pr-4 text-gray-600">{new Date(s.updatedAt).toLocaleString()}</td>
              <td className="py-3">
                <Link
                  href={`/admin/chats/${s.id}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Read →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sessions.length === 0 && (
        <p className="py-10 text-center text-gray-500">No tutor conversations yet.</p>
      )}
    </div>
  );
}
