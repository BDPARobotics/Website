import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { NotificationForm } from "@/components/admin/notification-form";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Notification } from "@/lib/types";

export default async function AdminNotificationsPage() {
  await requireAdminPage();
  const snap = await getAdminDb()
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  const notifications = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Notification) }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">Sent notifications</h2>
        <ul className="mt-4 space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#233242]">{n.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">{n.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <DeleteButton url={`/api/admin/notifications/${n.id}`} />
            </li>
          ))}
        </ul>
        {notifications.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No notifications sent yet.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">New notification</h2>
        <NotificationForm />
      </div>
    </div>
  );
}
