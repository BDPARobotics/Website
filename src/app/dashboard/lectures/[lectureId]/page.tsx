import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { youTubeEmbedUrl } from "@/lib/lectures";
import { DocViewer } from "@/components/doc-viewer";
import type { Lecture } from "@/lib/types";

function Recording({ url }: { url: string }) {
  const embed = youTubeEmbedUrl(url);
  if (embed) {
    return (
      <iframe
        src={embed}
        title="Lecture recording"
        allowFullScreen
        className="aspect-video w-full rounded-lg border border-gray-200 bg-black"
      />
    );
  }
  if (/\.mp4(?:$|\?)/i.test(decodeURIComponent(url))) {
    return <video src={url} controls className="w-full rounded-lg" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
    >
      Watch the recording ↗
    </a>
  );
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { lectureId } = await params;
  const snap = await getAdminDb().collection("lectures").doc(lectureId).get();
  if (!snap.exists) notFound();
  const lecture = snap.data() as Lecture;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Link href="/dashboard/lectures" className="text-sm text-gray-400 hover:text-primary">
        ← Lecture Library
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-[#233242]">{lecture.title}</h1>
      <p className="mt-1 text-sm text-gray-500">{lecture.date}</p>
      {lecture.description && <p className="mt-4 text-[#4a5568]">{lecture.description}</p>}

      {lecture.recordingUrl && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#233242]">Recording</h2>
          <div className="mt-3">
            <Recording url={lecture.recordingUrl} />
          </div>
        </section>
      )}

      {lecture.slidesUrl && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#233242]">Slides</h2>
          <div className="mt-3">
            <DocViewer url={lecture.slidesUrl} title={`${lecture.title} slides`} />
          </div>
        </section>
      )}

      {!lecture.recordingUrl && !lecture.slidesUrl && (
        <p className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          Materials for this lecture haven&apos;t been posted yet.
        </p>
      )}
    </main>
  );
}
