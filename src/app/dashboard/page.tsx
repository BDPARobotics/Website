import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { getNotificationsForUser } from "@/lib/notifications";
import { SignOutButton } from "@/components/sign-out-button";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { CalendarWidget } from "@/components/calendar-widget";
import type { CalendarEvent, Course, Module } from "@/lib/types";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getAdminDb();
  const [coursesSnap, eventsSnap, { unreadCount }] = await Promise.all([
    db.collection("courses").orderBy("order").get(),
    db.collection("events").orderBy("date", "asc").get(),
    getNotificationsForUser(user.uid),
  ]);
  const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Course) }));
  const events = eventsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEvent) }));

  const modulesByCourse = new Map<string, (Module & { id: string })[]>();
  await Promise.all(
    courses.map(async (course) => {
      const modulesSnap = await db
        .collection("modules")
        .where("courseId", "==", course.id)
        .get();
      const modules = modulesSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Module) }))
        .sort((a, b) => a.order - b.order);
      modulesByCourse.set(course.id, modules);
    }),
  );

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#233242]">
            Welcome, {user.name ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{user.role ?? "student"}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <a
              href="/admin"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Admin
            </a>
          )}
          <SignOutButton />
        </div>
      </div>

      <DashboardTabs active="courses" unreadCount={unreadCount} />

      <CalendarWidget events={events} />

      <div className="mt-10 space-y-10">
        {courses.map((course) => {
          const modules = modulesByCourse.get(course.id) ?? [];
          return (
            <section key={course.id}>
              <h2 className="text-xl font-bold text-[#233242]">{course.title}</h2>
              {course.description && (
                <p className="mt-1 text-sm text-gray-500">{course.description}</p>
              )}
              <ul className="mt-4 space-y-3">
                {modules.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/dashboard/modules/${m.id}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary"
                    >
                      <span className="font-medium text-[#233242]">
                        {m.order}. {m.title}
                      </span>
                      {m.type === "arm_challenge" && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          Robot Arm Challenge
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {modules.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No modules yet.
                </p>
              )}
            </section>
          );
        })}

        {courses.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Your courses will appear here.
          </div>
        )}
      </div>
    </main>
  );
}
