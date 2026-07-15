"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkCompleteButton({
  moduleId,
  completed,
}: {
  moduleId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (completed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
        ✓ Completed
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId, status: "completed" }),
        });
        setBusy(false);
        router.refresh();
      }}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {busy ? "Saving…" : "Mark as complete"}
    </button>
  );
}
