import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { SubmissionReview } from "@/components/admin/submission-review";
import type { Submission } from "@/lib/types";

export default async function AdminSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  await requireAdminPage();
  const { submissionId } = await params;
  const db = getAdminDb();

  const snap = await db.collection("submissions").doc(submissionId).get();
  if (!snap.exists) notFound();
  const submission = snap.data() as Submission;

  const [userSnap, moduleSnap] = await Promise.all([
    db.collection("users").doc(submission.uid).get(),
    db.collection("modules").doc(submission.moduleId).get(),
  ]);

  return (
    <div>
      <Link href="/admin/submissions" className="text-sm text-gray-400 hover:text-primary">
        ← All submissions
      </Link>
      <h2 className="mt-2 text-xl font-semibold text-[#233242]">
        {userSnap.data()?.displayName ?? submission.uid} — {moduleSnap.data()?.title ?? "(deleted module)"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Attempt #{submission.attemptNum} · {submission.language} ·{" "}
        {new Date(submission.submittedAt).toLocaleString()}
        {submission.videoUrl && (
          <>
            {" · "}
            <a
              href={submission.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Watch run video ↗
            </a>
          </>
        )}
      </p>
      {submission.notes && (
        <p className="mt-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">Student notes:</span> {submission.notes}
        </p>
      )}

      <pre className="mt-6 overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100">
        <code>{submission.code}</code>
      </pre>

      <SubmissionReview submissionId={submissionId} initialFeedback={submission.feedback ?? ""} />
    </div>
  );
}
