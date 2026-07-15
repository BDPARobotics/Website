import Link from "next/link";

export function DashboardTabs({
  active,
  unreadCount,
}: {
  active: "courses" | "notifications";
  unreadCount: number;
}) {
  const tabClass = (tab: "courses" | "notifications") =>
    `border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
      active === tab
        ? "border-primary text-primary"
        : "border-transparent text-gray-500 hover:text-primary"
    }`;

  return (
    <nav className="mt-8 flex gap-6 border-b border-gray-200">
      <Link href="/dashboard" className={tabClass("courses")}>
        Courses
      </Link>
      <Link href="/dashboard/notifications" className={tabClass("notifications")}>
        Notifications
        {unreadCount > 0 && (
          <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
