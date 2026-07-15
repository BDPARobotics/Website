import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getNotificationsForUser } from "@/lib/notifications";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { NotificationsReadTracker } from "@/components/notifications-read-tracker";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { notifications, unreadCount } = await getNotificationsForUser(user.uid);

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#233242]">Notifications</h1>
      <DashboardTabs active="notifications" unreadCount={0} />
      <NotificationsReadTracker hadUnread={unreadCount > 0} />

      <ul className="mt-8 space-y-3">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 ${
              n.read ? "border-gray-200 bg-white" : "border-primary/40 bg-primary/5"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-[#233242]">{n.title}</p>
              {!n.read && (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{n.body}</p>
            {n.link && (
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                Learn more →
              </a>
            )}
            <p className="mt-2 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>

      {notifications.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No notifications yet.
        </div>
      )}
    </main>
  );
}
