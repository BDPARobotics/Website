"use client";

import { useEffect, useState } from "react";
import type { Submission } from "@/lib/types";

const LANGUAGE_LABELS: Record<string, string> = {
  cpp: "Arduino C++",
  micropython: "MicroPython",
  other: "Other",
};

export function ChallengeSubmission({
  moduleId,
  prefillCode,
  simulatorSummary,
}: {
  moduleId: string;
  prefillCode?: string;
  simulatorSummary?: string;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [language, setLanguage] = useState(prefillCode ? "other" : "cpp");
  const [code, setCode] = useState(prefillCode ?? "");
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function loadSubmissions() {
    const res = await fetch(`/api/submissions?moduleId=${moduleId}`);
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    }
  }

  useEffect(() => {
    fetch(`/api/submissions?moduleId=${moduleId}`)
      .then((r) => (r.ok ? r.json() : { submissions: [] }))
      .then((d) => setSubmissions(d.submissions ?? []))
      .catch(() => {});
  }, [moduleId]);

  // Pull in whatever the student most recently tested in the simulator —
  // it's just a convenience prefill, not authoritative (see submit()). Adjust
  // state during render (React's recommended pattern for syncing from a
  // changing prop) rather than in an effect, to avoid an extra render pass.
  const [syncedPrefillCode, setSyncedPrefillCode] = useState(prefillCode);
  if (prefillCode && prefillCode !== syncedPrefillCode) {
    setSyncedPrefillCode(prefillCode);
    setCode(prefillCode);
    setLanguage("other");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, language, code, notes, videoUrl }),
    });
    setBusy(false);
    if (res.ok) {
      const { attemptNum } = await res.json();
      setMessage({ kind: "ok", text: `Attempt ${attemptNum} submitted! A mentor will review it.` });
      setNotes("");
      setVideoUrl("");
      loadSubmissions().catch(() => {});
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ kind: "error", text: data.error ?? "Submission failed — try again." });
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-[#233242]">Submit your challenge</h2>
      <p className="mt-1 text-sm text-gray-500">
        Paste the code you ran on your MaxArm. Add a video link so mentors can see your run.
      </p>
      {simulatorSummary && (
        <p className="mt-3 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
          Simulator result (not an official grade — a mentor still reviews every attempt):{" "}
          {simulatorSummary}
        </p>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="cpp">Arduino C++</option>
            <option value="micropython">MicroPython</option>
            <option value="other">Other</option>
          </select>
          <input
            type="url"
            placeholder="Video link (optional)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <textarea
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          placeholder="// paste your challenge code here"
          spellCheck={false}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
        />
        <input
          type="text"
          placeholder="Notes for your mentor (optional) — what works, what you're stuck on"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {message && (
          <p className={`text-sm ${message.kind === "ok" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit attempt"}
        </button>
      </form>

      {submissions.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-[#233242]">Your attempts</h3>
          <ul className="mt-2 space-y-2">
            {submissions.map((s) => (
              <li key={s.attemptNum} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#233242]">Attempt {s.attemptNum}</span>
                  <span className="text-gray-400">
                    {LANGUAGE_LABELS[s.language] ?? s.language} ·{" "}
                    {new Date(s.submittedAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "reviewed"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {s.status === "reviewed" ? "Reviewed" : "Awaiting review"}
                  </span>
                </div>
                {s.feedback && (
                  <p className="mt-2 rounded-md bg-white p-2 text-[#233242]">
                    <span className="font-medium">Mentor feedback:</span> {s.feedback}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
