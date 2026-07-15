import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { ChallengeModuleBody } from "@/components/arm-simulator/ChallengeModuleBody";
import { ChallengeSubmission } from "@/components/challenge-submission";
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

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary">
        ← {course?.title ?? "Dashboard"}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#233242] sm:text-3xl">{module_.title}</h1>
          {module_.type === "arm_challenge" && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Robot Arm Challenge
            </span>
          )}
        </div>
        <MarkCompleteButton moduleId={moduleId} completed={progress?.status === "completed"} />
      </div>

      <div className="mt-8">
        {module_.type === "arm_challenge" && module_.armChallenge ? (
          <ChallengeModuleBody
            moduleId={moduleId}
            contentBlocks={module_.contentBlocks}
            armChallenge={module_.armChallenge}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <ModuleContent blocks={module_.contentBlocks} />
              {module_.type === "arm_challenge" && <ChallengeSubmission moduleId={moduleId} />}
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ModuleChat moduleId={moduleId} />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
