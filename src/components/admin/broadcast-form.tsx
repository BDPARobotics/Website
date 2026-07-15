"use client";

import { useState } from "react";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "everyone",
  student: "all students",
  mentor: "all mentors",
};

export function BroadcastForm() {
  const [audience, setAudience] = useState("student");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setResult(null);
    setBusy(true);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, audience }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setArmed(false);
    if (res.ok) {
      setResult(
        data.note ??
          `Sent to ${data.sent} recipient${data.sent === 1 ? "" : "s"}${data.failed ? `, ${data.failed} failed` : ""}.`,
      );
      if (data.sent > 0) {
        setSubject("");
        setMessage("");
      }
    } else {
      setResult(`Failed: ${data.error ?? res.status}`);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-[#233242]">Email your members</h2>
      <p className="mt-0.5 text-xs text-gray-400">
        Sends a real email to every account in the selected audience via Resend.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <select
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value);
            setArmed(false);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
          <option value="all">Everyone</option>
        </select>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <textarea
        placeholder="Your message — plain text, line breaks preserved"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={busy || !subject.trim() || !message.trim()}
          onClick={() => (armed ? send() : setArmed(true))}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            armed ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-hover"
          }`}
        >
          {busy ? "Sending…" : armed ? `Confirm — email ${AUDIENCE_LABELS[audience]}` : "Send email"}
        </button>
        {armed && !busy && (
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="text-sm text-gray-500 hover:text-primary"
          >
            Cancel
          </button>
        )}
        {result && (
          <span className={`text-sm ${result.startsWith("Failed") ? "text-red-600" : "text-green-600"}`}>
            {result}
          </span>
        )}
      </div>
    </div>
  );
}
