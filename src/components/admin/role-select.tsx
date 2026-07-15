"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["student", "mentor", "admin"] as const;

export function RoleSelect({
  uid,
  initialRole,
  isSelf,
}: {
  uid: string;
  initialRole: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <select
        defaultValue={initialRole}
        disabled={busy || isSelf}
        title={isSelf ? "You can't change your own role" : undefined}
        onChange={async (e) => {
          setError(null);
          setBusy(true);
          const res = await fetch(`/api/admin/users/${uid}/role`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: e.target.value }),
          });
          setBusy(false);
          if (res.ok) {
            router.refresh();
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "failed");
          }
        }}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm capitalize disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
