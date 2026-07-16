import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { getNotificationsForUser } from "@/lib/notifications";
import { CalendarWidget } from "@/components/calendar-widget";
import { DashboardTabs } from "@/components/dashboard-tabs";
import type { CalendarEvent } from "@/lib/types";

export default async function StudentCalendarPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getAdminDb();
  const [eventsSnap, { unreadCount }] = await Promise.all([
    db.collection("events").orderBy("date", "asc").get(),
    getNotificationsForUser(user.uid),
  ]);
  const events = eventsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEvent) }));

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-[#233242]">Calendar</h1>
      <p className="mt-1 text-sm text-gray-500">
        Upcoming sessions, deadlines, and events.
      </p>

      <DashboardTabs active="calendar" unreadCount={unreadCount} />

      <CalendarWidget events={events} />
    </main>
  );
}
