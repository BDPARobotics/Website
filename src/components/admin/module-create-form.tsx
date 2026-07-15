"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ModuleCreateForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState("1");
  const [type, setType] = useState("content");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        const res = await fetch("/api/admin/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, title, order: Number(order), type }),
        });
        setBusy(false);
        if (res.ok) {
          const { id } = await res.json();
          router.push(`/admin/modules/${id}`);
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to create module");
        }
      }}
    >
      <input
        type="text"
        required
        placeholder="Module title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="flex gap-3">
        <input
          type="number"
          required
          placeholder="Order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="content">Content</option>
          <option value="arm_challenge">Robot arm challenge</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create module"}
      </button>
    </form>
  );
}
