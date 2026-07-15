"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Winner } from "@/lib/types";

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function WinnerForm({
  winnerId,
  initial,
  onDone,
}: {
  winnerId?: string;
  initial?: Winner;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initial ? String(initial.year) : "2026");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [challenge, setChallenge] = useState(initial?.challenge ?? "");
  const [teamName, setTeamName] = useState(initial?.teamName ?? "");
  const [chapter, setChapter] = useState(initial?.chapter ?? "");
  const [members, setMembers] = useState(initial?.members ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function uploadPhoto(file: File) {
    setStatus(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      setPhotoUrl(url);
      setStatus("Photo uploaded.");
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
        const res = await fetch(winnerId ? `/api/admin/winners/${winnerId}` : "/api/admin/winners", {
          method: winnerId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, place, challenge, teamName, chapter, members, photoUrl, description }),
        });
        setBusy(false);
        if (res.ok) {
          if (!winnerId) {
            setPlace("");
            setChallenge("");
            setTeamName("");
            setChapter("");
            setMembers("");
            setPhotoUrl("");
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
      <div className="flex gap-3">
        <input
          type="number"
          required
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={`${inputCls} w-28`}
        />
        <input
          type="text"
          required
          placeholder="Place — e.g. Champion, 1st Place"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          className={inputCls}
        />
      </div>
      <input
        type="text"
        placeholder="Challenge / event (optional) — e.g. Stack Em' Up"
        value={challenge}
        onChange={(e) => setChallenge(e.target.value)}
        className={inputCls}
      />
      <input
        type="text"
        required
        placeholder="Team name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        className={inputCls}
      />
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Chapter (optional)"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          className={inputCls}
        />
        <input
          type="text"
          placeholder="Members, comma-separated (optional)"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Photo URL — or upload"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
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
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPhoto(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <textarea
        placeholder="What they built / how they won (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className={inputCls}
      />
      {status && (
        <p className={`text-sm ${status.endsWith("uploaded.") ? "text-green-600" : "text-red-600"}`}>{status}</p>
      )}
      <button
        type="submit"
        disabled={busy || uploading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {busy ? "Saving…" : winnerId ? "Save changes" : "Add winner"}
      </button>
    </form>
  );
}

export function WinnerRow({ id, winner }: { id: string; winner: Winner }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[#233242]">
            {winner.year} · {winner.place} — {winner.teamName}
          </p>
          <p className="text-sm text-gray-500">
            {[winner.challenge, winner.chapter].filter(Boolean).join(" · ") || "—"}
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
          <DeleteButton url={`/api/admin/winners/${id}`} />
        </div>
      </div>
      {editing && (
        <div className="mt-4">
          <WinnerForm winnerId={id} initial={winner} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}
