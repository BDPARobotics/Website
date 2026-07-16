import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminPage } from "@/lib/auth/guards";
import { Markdown } from "@/components/markdown";
import type { ChatSession } from "@/lib/types";

export default async function AdminChatDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireAdminPage();
  const { sessionId } = await params;
  const db = getAdminDb();

  const snap = await db.collection("chat_sessions").doc(sessionId).get();
  if (!snap.exists) notFound();
  const session = snap.data() as ChatSession;

  const [userSnap, moduleSnap] = await Promise.all([
    db.collection("users").doc(session.uid).get(),
    db.collection("modules").doc(session.moduleId).get(),
  ]);
  const studentName = userSnap.data()?.displayName ?? session.uid;
  const moduleTitle = moduleSnap.data()?.title ?? "(deleted module)";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/chats" className="text-sm text-gray-400 hover:text-primary">
        ← All chats
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-[#233242]">
          {studentName} · {moduleTitle}
        </h2>
        <p className="text-sm text-gray-500">
          {session.messages.length} messages · last active{" "}
          {new Date(session.updatedAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {session.messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto w-fit max-w-[85%]">
              <div className="rounded-3xl bg-gray-100 px-4 py-2 text-sm whitespace-pre-wrap text-[#233242]">
                {m.content}
              </div>
              <p className="mt-1 text-right text-xs text-gray-400">
                {studentName} · {new Date(m.ts).toLocaleString()}
              </p>
            </div>
          ) : (
            <div key={i}>
              <div className="text-sm text-[#233242]">
                <Markdown text={m.content} />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                AI Tutor · {new Date(m.ts).toLocaleString()}
              </p>
            </div>
          ),
        )}
        {session.messages.length === 0 && (
          <p className="py-10 text-center text-gray-500">This conversation is empty.</p>
        )}
      </div>
    </div>
  );
}
