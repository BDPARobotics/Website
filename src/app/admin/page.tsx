import Link from "next/link";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";

export default async function AdminOverviewPage() {
  await requireAdminPage();
  const db = getAdminDb();
  const [users, courses, modules] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("courses").count().get(),
    db.collection("modules").count().get(),
  ]);

  const stats = [
    { label: "Students & mentors", value: users.data().count, href: "/admin/users" },
    { label: "Courses", value: courses.data().count, href: "/admin/courses" },
    { label: "Modules", value: modules.data().count, href: "/admin/courses" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-primary"
        >
          <p className="text-3xl font-bold text-[#233242]">{s.value}</p>
          <p className="mt-1 text-sm text-gray-500">{s.label}</p>
        </Link>
      ))}
    </div>
  );
}
