import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { streamGemini, type GeminiMessage } from "@/lib/ai/gemini";
import { buildTutorSystemPrompt } from "@/lib/ai/prompts";
import type { ChatMessage, Module, Submission } from "@/lib/types";

export const maxDuration = 60;

const DAILY_MESSAGE_CAP = 50;
const HISTORY_WINDOW = 12; // messages sent to the model
const STORED_LIMIT = 60; // messages kept in Firestore

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const moduleId = new URL(req.url).searchParams.get("moduleId");
  if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });

  const snap = await getAdminDb().collection("chat_sessions").doc(`${user.uid}_${moduleId}`).get();
  return NextResponse.json({ messages: snap.exists ? (snap.data()?.messages ?? []) : [] });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { moduleId, message, code, lastResults } = body;
  if (typeof moduleId !== "string" || !moduleId) {
    return NextResponse.json({ error: "moduleId required" }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 4000) {
    return NextResponse.json({ error: "message must be 1–4000 characters" }, { status: 400 });
  }

  const db = getAdminDb();
  const moduleSnap = await db.collection("modules").doc(moduleId).get();
  if (!moduleSnap.exists) {
    return NextResponse.json({ error: "module not found" }, { status: 404 });
  }
  const moduleDoc = moduleSnap.data() as Module;

  // Per-user daily cap so one student can't burn the whole quota.
  const day = new Date().toISOString().slice(0, 10);
  const usageRef = db.collection("ai_usage").doc(`${user.uid}_${day}`);
  const allowed = await db.runTransaction(async (tx) => {
    const usage = await tx.get(usageRef);
    const count = usage.exists ? (usage.data()?.count ?? 0) : 0;
    if (count >= DAILY_MESSAGE_CAP) return false;
    tx.set(usageRef, { uid: user.uid, day, count: count + 1 }, { merge: true });
    return true;
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Daily AI message limit reached — try again tomorrow." },
      { status: 429 },
    );
  }

  const sessionRef = db.collection("chat_sessions").doc(`${user.uid}_${moduleId}`);
  const sessionSnap = await sessionRef.get();
  const history: ChatMessage[] = sessionSnap.exists ? (sessionSnap.data()?.messages ?? []) : [];

  // For challenge modules with no live code in the request, give the tutor
  // the student's most recent submission so it can help debug.
  let tutorCode = typeof code === "string" ? code : undefined;
  let codeOrigin = tutorCode ? "current working copy" : undefined;
  if (!tutorCode && moduleDoc.type === "arm_challenge") {
    const subs = await db
      .collection("submissions")
      .where("uid", "==", user.uid)
      .where("moduleId", "==", moduleId)
      .get();
    const latest = subs.docs
      .map((d) => d.data() as Submission)
      .sort((a, b) => b.attemptNum - a.attemptNum)[0];
    if (latest) {
      tutorCode = latest.code;
      codeOrigin = `their submitted attempt ${latest.attemptNum}, written in ${latest.language}`;
    }
  }

  const system = buildTutorSystemPrompt(moduleDoc, {
    code: tutorCode,
    codeOrigin,
    lastResults: typeof lastResults === "string" ? lastResults : undefined,
  });
  const modelMessages: GeminiMessage[] = [
    ...history.slice(-HISTORY_WINDOW).map(
      (m): GeminiMessage => ({ role: m.role === "assistant" ? "model" : "user", text: m.content }),
    ),
    { role: "user", text: message },
  ];

  const now = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of streamGemini({ system, messages: modelMessages })) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        const combined: ChatMessage[] = [
          ...history,
          { role: "user", content: message, ts: now },
          { role: "assistant", content: full, ts: Date.now() },
        ];
        const messages = combined.slice(-STORED_LIMIT);
        await sessionRef.set(
          {
            uid: user.uid,
            moduleId,
            messages,
            hintLevel: sessionSnap.data()?.hintLevel ?? 0,
            createdAt: sessionSnap.data()?.createdAt ?? now,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
        controller.close();
      } catch (err) {
        console.error("ai chat stream failed:", err);
        if (!full) {
          controller.enqueue(
            encoder.encode("Sorry — the tutor hit an error. Please try again in a moment."),
          );
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
