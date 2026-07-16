import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { getNotificationsForUser } from "@/lib/notifications";
import { SignOutButton } from "@/components/sign-out-button";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { CalendarWidget } from "@/components/calendar-widget";
import type { CalendarEvent, ContentBlock, Course, Module, Progress, ProgressStatus } from "@/lib/types";

type ModuleWithId = Module & { id: string };

const BLOCK_LABELS: Record<ContentBlock["type"], string> = {
  text: "Reading",
  code: "Code",
  image: "Diagrams",
  video: "Video",
  pdf: "Handout",
};

function contentChips(m: ModuleWithId): string[] {
  const chips: string[] = [];
  if (m.type === "arm_challenge") chips.push("AI Tutor");
  for (const block of m.contentBlocks ?? []) {
    const label = BLOCK_LABELS[block.type];
    if (label && !chips.includes(label)) chips.push(label);
  }
  return chips;
}

function modulePreview(m: ModuleWithId): string | null {
  const textBlock = (m.contentBlocks ?? []).find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  const firstLine = textBlock.content.split("\n").find((line) => line.trim());
  return firstLine?.trim() ?? null;
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getAdminDb();
  const [coursesSnap, eventsSnap, progressSnap, { unreadCount }] = await Promise.all([
    db.collection("courses").orderBy("order").get(),
    db.collection("events").orderBy("date", "asc").get(),
    db.collection("progress").where("uid", "==", user.uid).get(),
    getNotificationsForUser(user.uid),
  ]);
  const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Course) }));
  const events = eventsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEvent) }));

  const progressByModule = new Map<string, ProgressStatus>();
  for (const doc of progressSnap.docs) {
    const p = doc.data() as Progress;
    progressByModule.set(p.moduleId, p.status);
  }

  const modulesByCourse = new Map<string, ModuleWithId[]>();
  await Promise.all(
    courses.map(async (course) => {
      const modulesSnap = await db
        .collection("modules")
        .where("courseId", "==", course.id)
        .get();
      const modules = modulesSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Module) }))
        .sort((a, b) => a.order - b.order);
      modulesByCourse.set(course.id, modules);
    }),
  );

  // All challenge questions, surfaced in the banner as clickable cards.
  const armChallenges = courses.flatMap((c) =>
    (modulesByCourse.get(c.id) ?? []).filter((m) => m.type === "arm_challenge"),
  );

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#233242]">
            Welcome, {user.name ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{user.role ?? "student"}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <a
              href="/admin"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Admin
            </a>
          )}
          <SignOutButton />
        </div>
      </div>

      <DashboardTabs active="courses" unreadCount={unreadCount} />

      {armChallenges.length > 0 && (
        <section className="mt-8 rounded-2xl bg-[#233242] p-6 sm:p-8">
          <p className="text-xs font-bold tracking-widest text-[#51b56d] uppercase">
            Robot Arm Challenge
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Pick your challenge</h2>
            <p className="text-sm text-white/70">
              Read the question, then work through it with your AI tutor.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {armChallenges.map((m) => {
              const status = progressByModule.get(m.id) ?? "not_started";
              const preview = modulePreview(m);
              return (
                <Link
                  key={m.id}
                  href={`/dashboard/modules/${m.id}`}
                  className="group flex flex-col rounded-xl bg-white/10 p-4 transition-colors hover:bg-white/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white">
                      {m.title.replace(/^Challenge:\s*/, "")}
                    </h3>
                    {status === "completed" ? (
                      <span className="shrink-0 rounded-full bg-[#51b56d]/20 px-2 py-0.5 text-xs font-medium text-[#51b56d]">
                        Done ✓
                      </span>
                    ) : status === "in_progress" ? (
                      <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        In progress
                      </span>
                    ) : null}
                  </div>
                  {preview && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-white/60">{preview}</p>
                  )}
                  <span className="mt-auto pt-3 text-sm font-semibold text-[#51b56d] group-hover:underline">
                    Enter →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <CalendarWidget events={events} />

      <div className="mt-10 space-y-10">
        {courses.map((course) => {
          const modules = modulesByCourse.get(course.id) ?? [];
          return (
            <section key={course.id}>
              <h2 className="text-xl font-bold text-[#233242]">{course.title}</h2>
              {course.description && (
                <p className="mt-1 text-sm text-gray-500">{course.description}</p>
              )}
              <ul className="mt-4 space-y-3">
                {modules.map((m) => {
                  const isChallenge = m.type === "arm_challenge";
                  const status = progressByModule.get(m.id) ?? "not_started";
                  const preview = modulePreview(m);
                  const chips = contentChips(m);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/dashboard/modules/${m.id}`}
                        className={`flex items-start justify-between gap-4 rounded-xl border bg-white p-5 transition-colors hover:border-primary ${
                          isChallenge ? "border-primary/40 bg-primary/[0.03]" : "border-gray-200"
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              status === "completed"
                                ? "bg-[#51b56d] text-white"
                                : "bg-gray-100 text-[#233242]"
                            }`}
                          >
                            {status === "completed" ? "✓" : m.order}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#233242]">{m.title}</span>
                              {isChallenge && (
                                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                                  Robot Arm Challenge
                                </span>
                              )}
                              {status === "in_progress" && (
                                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-700">
                                  In progress
                                </span>
                              )}
                            </div>
                            {preview && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{preview}</p>
                            )}
                            {chips.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {chips.map((chip) => (
                                  <span
                                    key={chip}
                                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 self-center text-sm font-semibold text-primary">
                          {isChallenge ? "Enter →" : status === "completed" ? "Review →" : "Open →"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {modules.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No modules yet.
                </p>
              )}
            </section>
          );
        })}

        {courses.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Your courses will appear here.
          </div>
        )}
      </div>
    </main>
  );
}
