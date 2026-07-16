import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { ModuleChat } from "@/components/module-chat";
import { ModuleContent } from "@/components/module-content";
import type { Course, Module, Progress } from "@/lib/types";

export default async function StudentModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { moduleId } = await params;
  const db = getAdminDb();

  const moduleSnap = await db.collection("modules").doc(moduleId).get();
  if (!moduleSnap.exists) notFound();
  const module_ = moduleSnap.data() as Module;

  const [courseSnap, progressSnap] = await Promise.all([
    db.collection("courses").doc(module_.courseId).get(),
    db.collection("progress").doc(`${user.uid}_${moduleId}`).get(),
  ]);
  const course = courseSnap.exists ? (courseSnap.data() as Course) : null;
  const progress = progressSnap.exists ? (progressSnap.data() as Progress) : null;

  // Challenge modules: ChatGPT-style full-page chat. Problem statement on
  // top (code blocks hidden — they're the solution), tutor fills the rest
  // of the viewport. 4.5rem ≈ the sticky site header.
  if (module_.type === "arm_challenge") {
    return (
      <main className="flex h-[calc(100dvh-4.5rem)] flex-col">
        <div className="container mx-auto w-full max-w-4xl px-4 pt-6 sm:px-6">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary">
            ← {course?.title ?? "Dashboard"}
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#233242] sm:text-3xl">{module_.title}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Robot Arm Challenge
              </span>
            </div>
            <MarkCompleteButton moduleId={moduleId} completed={progress?.status === "completed"} />
          </div>
          <div className="mt-4 max-h-[30vh] overflow-y-auto border-b border-gray-100 pb-4">
            <ModuleContent
              blocks={(module_.contentBlocks ?? []).filter((b) => b.type !== "code")}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ModuleChat moduleId={moduleId} variant="full" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary">
        ← {course?.title ?? "Dashboard"}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#233242] sm:text-3xl">{module_.title}</h1>
        <MarkCompleteButton moduleId={moduleId} completed={progress?.status === "completed"} />
      </div>

      <div className="mt-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_480px]">
          <div>
            <ModuleContent blocks={module_.contentBlocks} />
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ModuleChat moduleId={moduleId} />
          </aside>
        </div>
      </div>
    </main>
  );
}
