"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, order: Number(order) }),
        });
        setBusy(false);
        if (res.ok) {
          setTitle("");
          setDescription("");
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to create course");
        }
      }}
    >
      <input
        type="text"
        required
        placeholder="Course title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <textarea
        placeholder="Short description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <input
        type="number"
        required
        placeholder="Order"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create course"}
      </button>
    </form>
  );
}
