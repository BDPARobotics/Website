"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseEditForm({
  courseId,
  initialTitle,
  initialDescription,
  initialOrder,
}: {
  courseId: string;
  initialTitle: string;
  initialDescription: string;
  initialOrder: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [order, setOrder] = useState(String(initialOrder));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-[#233242] hover:border-primary"
      >
        Edit course
      </button>
    );
  }

  return (
    <form
      className="mt-2 w-full space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus(null);
        setBusy(true);
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, order: Number(order) }),
        });
        setBusy(false);
        if (res.ok) {
          setOpen(false);
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus(data.error ?? "Failed to save");
        }
      }}
    >
      <input
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <input
        type="number"
        required
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      {status && <p className="text-sm text-red-600">{status}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-[#233242]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
