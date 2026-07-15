"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Lecture } from "@/lib/types";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function LectureForm({
  lectureId,
  initial,
  onDone,
}: {
  lectureId?: string;
  initial?: Lecture;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [recordingUrl, setRecordingUrl] = useState(initial?.recordingUrl ?? "");
  const [slidesUrl, setSlidesUrl] = useState(initial?.slidesUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function uploadSlides(file: File) {
    setStatus(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      setSlidesUrl(url);
      setStatus("Slides uploaded.");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(`Upload failed: ${data.error ?? res.status}`);
    }
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus(null);
        setBusy(true);
        const res = await fetch(lectureId ? `/api/admin/lectures/${lectureId}` : "/api/admin/lectures", {
          method: lectureId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, date, description, recordingUrl, slidesUrl }),
        });
        setBusy(false);
        if (res.ok) {
          if (!lectureId) {
            setTitle("");
            setDate("");
            setDescription("");
            setRecordingUrl("");
            setSlidesUrl("");
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
        placeholder="Lecture title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputCls}
      />
      <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      <textarea
        placeholder="What was covered?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className={inputCls}
      />
      <input
        type="url"
        placeholder="Recording link (YouTube, Zoom…) — optional"
        value={recordingUrl}
        onChange={(e) => setRecordingUrl(e.target.value)}
        className={inputCls}
      />
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Slides URL — or upload PDF/PowerPoint"
          value={slidesUrl}
          onChange={(e) => setSlidesUrl(e.target.value)}
          className={inputCls}
        />
        <label
          className={`shrink-0 cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-[#233242] hover:border-primary ${uploading ? "opacity-60" : ""}`}
        >
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            hidden
            disabled={uploading}
            accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadSlides(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {status && (
        <p className={`text-sm ${status.endsWith("uploaded.") ? "text-green-600" : "text-red-600"}`}>{status}</p>
      )}
      <button
        type="submit"
        disabled={busy || uploading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "Saving…" : lectureId ? "Save changes" : "Add lecture"}
      </button>
    </form>
  );
}

export function LectureRow({ id, lecture }: { id: string; lecture: Lecture }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[#233242]">{lecture.title}</p>
          <p className="text-sm text-gray-500">
            {lecture.date}
            {lecture.recordingUrl ? " · recording" : ""}
            {lecture.slidesUrl ? " · slides" : ""}
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
          <DeleteButton url={`/api/admin/lectures/${id}`} />
        </div>
      </div>
      {editing && (
        <div className="mt-4">
          <LectureForm lectureId={id} initial={lecture} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}
