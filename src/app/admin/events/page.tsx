import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { EventForm, EventRow } from "@/components/admin/event-form";
import type { CalendarEvent } from "@/lib/types";

export default async function AdminEventsPage() {
  await requireAdminPage();
  const snap = await getAdminDb().collection("events").orderBy("date", "asc").get();
  const events = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEvent) }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">Calendar events</h2>
        <ul className="mt-4 space-y-3">
          {events.map((e) => (
            <EventRow key={e.id} id={e.id} event={e} />
          ))}
        </ul>
        {events.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No events yet — add your first one.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">New event</h2>
        <div className="mt-4">
          <EventForm />
        </div>
      </div>
    </div>
  );
}
