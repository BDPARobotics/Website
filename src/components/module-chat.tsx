"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";

type Msg = { role: "user" | "assistant"; content: string };

export function ModuleChat({
  moduleId,
  code,
  lastResults,
  variant = "panel",
}: {
  moduleId: string;
  code?: string;
  lastResults?: string;
  // "panel" = bordered sidebar card; "full" = ChatGPT-style full-page chat
  // that fills its parent and centers the conversation column.
  variant?: "panel" | "full";
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/ai/chat?moduleId=${moduleId}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, [moduleId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function autosize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setBusy(true);
    setMessages((ms) => [...ms, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, message: text, code, lastResults }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The tutor is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((ms) => {
          const next = [...ms];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
    } catch (err) {
      setMessages((ms) => ms.slice(0, -2));
      setInput(text);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const full = variant === "full";
  const textSize = full ? "text-[15px]" : "text-sm";

  return (
    <div
      className={
        full
          ? "flex h-full min-h-0 flex-col bg-white"
          : "flex h-[calc(100vh-8rem)] min-h-[520px] flex-col rounded-xl border border-gray-200 bg-white"
      }
    >
      {!full && (
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-[#233242]">AI Tutor</p>
          <p className="text-xs text-gray-400">Knows this module — ask anything about it</p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto h-full w-full max-w-3xl space-y-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <p className={`font-semibold text-[#233242] ${full ? "text-2xl" : "text-base"}`}>
                What are you stuck on?
              </p>
              <p className={`mt-1 text-gray-400 ${full ? "text-base" : "text-sm"}`}>
                Ask the tutor anything about this module.
              </p>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className={`ml-auto w-fit max-w-[85%] rounded-3xl bg-gray-100 px-4 py-2 whitespace-pre-wrap text-[#233242] ${textSize}`}
              >
                {m.content}
              </div>
            ) : (
              <div key={i} className={`text-[#233242] ${textSize}`}>
                {m.content ? (
                  <Markdown text={m.content} />
                ) : busy && i === messages.length - 1 ? (
                  <span className="mt-1 inline-block h-3 w-3 animate-pulse rounded-full bg-gray-700" />
                ) : null}
              </div>
            ),
          )}
        </div>
      </div>

      {error && <p className="mx-auto w-full max-w-3xl px-4 pb-1 text-xs text-red-600">{error}</p>}

      <div className={full ? "px-4 pb-5" : "p-3"}>
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-gray-300 px-4 py-2 shadow-sm transition-colors focus-within:border-gray-400">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask anything"
            className={`max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[#233242] placeholder:text-gray-400 focus:outline-none ${textSize}`}
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#233242] text-white transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
