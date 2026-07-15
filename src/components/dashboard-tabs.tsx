import Link from "next/link";

type Tab = "courses" | "lectures" | "winners" | "notifications";

export function DashboardTabs({ active, unreadCount }: { active: Tab; unreadCount: number }) {
  const tabClass = (tab: Tab) =>
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
      <Link href="/dashboard/lectures" className={tabClass("lectures")}>
        Lectures
      </Link>
      <Link href="/dashboard/winners" className={tabClass("winners")}>
        Past Winners
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
