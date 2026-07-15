"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// Two-click delete: first click arms the button, second click within 3s fires.
export function DeleteButton({ url, redirectTo }: { url: string; redirectTo?: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 3000);
          return;
        }
        if (timer.current) clearTimeout(timer.current);
        setBusy(true);
        const res = await fetch(url, { method: "DELETE" });
        setBusy(false);
        setArmed(false);
        if (res.ok) {
          if (redirectTo) router.push(redirectTo);
          router.refresh();
        }
      }}
      className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        armed
          ? "border-red-600 bg-red-600 text-white"
          : "border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600"
      }`}
    >
      {busy ? "Deleting…" : armed ? "Confirm delete" : "Delete"}
    </button>
  );
}
