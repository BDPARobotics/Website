"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { EVENT_TYPE_LABELS } from "@/lib/events";
import { EVENT_TYPES, type CalendarEvent, type EventType } from "@/lib/types";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function EventForm({
  eventId,
  initial,
  onDone,
}: {
  eventId?: string;
  initial?: CalendarEvent;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? "other");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus(null);
        setBusy(true);
        const res = await fetch(eventId ? `/api/admin/events/${eventId}` : "/api/admin/events", {
          method: eventId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, date, time, type, location, link, description }),
        });
        setBusy(false);
        if (res.ok) {
          if (!eventId) {
            setTitle("");
            setDate("");
            setTime("");
            setType("other");
            setLocation("");
            setLink("");
            setDescription("");
          }
          onDone?.();
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus(data.error ?? "Save failed");
        }
      }}
    >
      <input
        type="text"
        required
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputCls}
      />
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${inputCls} w-auto`}
        />
        <input
          type="text"
          placeholder="Time (e.g. 6:00 PM ET) — optional"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={`${inputCls} min-w-0 flex-1`}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          className={`${inputCls} w-auto`}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        placeholder="Location — optional"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className={inputCls}
      />
      <input
        type="url"
        placeholder="Link — optional"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className={inputCls}
      />
      <textarea
        placeholder="Details — optional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className={inputCls}
      />
      {status && <p className="text-sm text-red-600">{status}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "Saving…" : eventId ? "Save changes" : "Add event"}
      </button>
    </form>
  );
}

export function EventRow({ id, event }: { id: string; event: CalendarEvent }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-[#233242]">{event.title}</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {EVENT_TYPE_LABELS[event.type]}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {event.date}
            {event.time ? ` · ${event.time}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-primary hover:text-primary"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <DeleteButton url={`/api/admin/events/${id}`} />
        </div>
      </div>
      {editing && (
        <div className="mt-4">
          <EventForm eventId={id} initial={event} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}
