"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SubmissionReview({
  submissionId,
  initialFeedback,
}: {
  submissionId: string;
  initialFeedback: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(initialFeedback);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-[#233242]">Mentor feedback</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={4}
        placeholder="What worked, what to fix, what to try next…"
        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={busy || !feedback.trim()}
          onClick={async () => {
            setStatus(null);
            setBusy(true);
            const res = await fetch(`/api/admin/submissions/${submissionId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ feedback }),
            });
            setBusy(false);
            if (res.ok) {
              setStatus("Saved — marked as reviewed.");
              router.refresh();
            } else {
              const data = await res.json().catch(() => ({}));
              setStatus(`Failed: ${data.error ?? res.status}`);
            }
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save feedback & mark reviewed"}
        </button>
        {status && (
          <span className={`text-sm ${status.startsWith("Saved") ? "text-green-600" : "text-red-600"}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
