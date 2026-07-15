import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-[#233242]">Admin</h1>
        <nav className="flex gap-5 text-sm font-medium text-[#233242]">
          <Link href="/admin" className="hover:text-primary">
            Overview
          </Link>
          <Link href="/admin/users" className="hover:text-primary">
            Users
          </Link>
          <Link href="/admin/courses" className="hover:text-primary">
            Courses
          </Link>
          <Link href="/admin/submissions" className="hover:text-primary">
            Submissions
          </Link>
          <Link href="/admin/events" className="hover:text-primary">
            Events
          </Link>
          <Link href="/admin/lectures" className="hover:text-primary">
            Lectures
          </Link>
          <Link href="/admin/winners" className="hover:text-primary">
            Winners
          </Link>
          <Link href="/admin/notifications" className="hover:text-primary">
            Notifications
          </Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-primary">
            ← Student view
          </Link>
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
