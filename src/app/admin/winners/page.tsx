import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { WinnerForm, WinnerRow } from "@/components/admin/winner-form";
import type { Winner } from "@/lib/types";

export default async function AdminWinnersPage() {
  await requireAdminPage();
  const snap = await getAdminDb().collection("winners").orderBy("year", "desc").get();
  const winners = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Winner) }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">Past winners</h2>
        <ul className="mt-4 space-y-3">
          {winners.map((w) => (
            <WinnerRow key={w.id} id={w.id} winner={w} />
          ))}
        </ul>
        {winners.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No winners recorded yet.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#233242]">Add winner</h2>
        <div className="mt-4">
          <WinnerForm />
        </div>
      </div>
    </div>
  );
}
