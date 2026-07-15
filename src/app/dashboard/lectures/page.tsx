import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { getNotificationsForUser } from "@/lib/notifications";
import { DashboardTabs } from "@/components/dashboard-tabs";
import type { Lecture } from "@/lib/types";

export default async function StudentLecturesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getAdminDb();
  const [snap, { unreadCount }] = await Promise.all([
    db.collection("lectures").orderBy("date", "desc").get(),
    getNotificationsForUser(user.uid),
  ]);
  const lectures = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Lecture) }));

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#233242]">Lecture Library</h1>
      <p className="mt-1 text-sm text-gray-500">
        Recordings and slides from past lectures — catch up any time.
      </p>

      <DashboardTabs active="lectures" unreadCount={unreadCount} />

      <ul className="mt-8 space-y-3">
        {lectures.map((l) => (
          <li key={l.id}>
            <Link
              href={`/dashboard/lectures/${l.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#233242]">{l.title}</p>
                {l.description && (
                  <p className="mt-0.5 truncate text-sm text-gray-500">{l.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                {l.recordingUrl && (
                  <span className="rounded-full bg-[#917aeb]/15 px-2.5 py-1 font-medium text-[#5f4bb6]">
                    Recording
                  </span>
                )}
                {l.slidesUrl && (
                  <span className="rounded-full bg-[#51b56d]/15 px-2.5 py-1 font-medium text-[#2e7d46]">
                    Slides
                  </span>
                )}
                <span className="text-gray-400">{l.date}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {lectures.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No lectures posted yet — check back after the next session.
        </p>
      )}
    </main>
  );
}
