import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { RoleSelect } from "@/components/admin/role-select";
import type { UserDoc } from "@/lib/types";

export default async function AdminUsersPage() {
  const me = await requireAdminPage();
  const snap = await getAdminDb()
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const users = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as UserDoc) }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="py-3 pr-4">Name</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Chapter</th>
            <th className="py-3 pr-4">School</th>
            <th className="py-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid} className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-[#233242]">{u.displayName}</td>
              <td className="py-3 pr-4 text-gray-600">{u.email}</td>
              <td className="py-3 pr-4 text-gray-600">{u.chapterId ?? "—"}</td>
              <td className="py-3 pr-4 text-gray-600">{u.university ?? "—"}</td>
              <td className="py-3">
                <RoleSelect uid={u.uid} initialRole={u.role} isSelf={u.uid === me.uid} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="py-10 text-center text-gray-500">No users yet.</p>
      )}
    </div>
  );
}
