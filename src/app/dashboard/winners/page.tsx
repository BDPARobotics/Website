import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { getNotificationsForUser } from "@/lib/notifications";
import { DashboardTabs } from "@/components/dashboard-tabs";
import type { Winner } from "@/lib/types";

export default async function PastWinnersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getAdminDb();
  const [snap, { unreadCount }] = await Promise.all([
    db.collection("winners").orderBy("year", "desc").get(),
    getNotificationsForUser(user.uid),
  ]);
  const winners = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Winner) }));

  const byYear = new Map<number, typeof winners>();
  for (const w of winners) {
    byYear.set(w.year, [...(byYear.get(w.year) ?? []), w]);
  }

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#233242]">Past Winners</h1>
      <p className="mt-1 text-sm text-gray-500">
        The teams that took home the Robot Arm Coding Competition.
      </p>

      <DashboardTabs active="winners" unreadCount={unreadCount} />

      <div className="mt-8 space-y-12">
        {[...byYear.entries()].map(([year, yearWinners]) => (
          <section key={year}>
            <h2 className="text-2xl font-bold text-[#233242]">{year}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {yearWinners.map((w) => (
                <div key={w.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {w.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded arbitrary URLs
                    <img src={w.photoUrl} alt={w.teamName} className="h-44 w-full object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#51b56d]/15 px-2.5 py-1 text-xs font-semibold text-[#2e7d46]">
                        {w.place}
                      </span>
                      {w.challenge && (
                        <span className="rounded-full bg-[#917aeb]/15 px-2.5 py-1 text-xs font-semibold text-[#5f4bb6]">
                          {w.challenge}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[#233242]">{w.teamName}</h3>
                    {w.chapter && <p className="text-sm text-gray-500">{w.chapter}</p>}
                    {w.members && <p className="mt-1 text-sm text-gray-500">{w.members}</p>}
                    {w.description && <p className="mt-2 text-sm text-[#4a5568]">{w.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {winners.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Winners will be posted here after the next competition — it could be you.
        </p>
      )}
    </main>
  );
}
