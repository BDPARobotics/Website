"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

// ChatGPT-style rendering: user messages in gray bubbles on the right,
// assistant replies as full-width markdown text.
function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: (props) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
        ul: (props) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
        ol: (props) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
        li: (props) => <li className="leading-relaxed" {...props} />,
        h1: (props) => <p className="mb-2 text-sm font-semibold" {...props} />,
        h2: (props) => <p className="mb-2 text-sm font-semibold" {...props} />,
        h3: (props) => <p className="mb-2 text-sm font-semibold" {...props} />,
        h4: (props) => <p className="mb-2 text-sm font-semibold" {...props} />,
        a: (props) => (
          <a className="text-primary underline" target="_blank" rel="noreferrer" {...props} />
        ),
        blockquote: (props) => (
          <blockquote className="mb-2 border-l-2 border-gray-300 pl-3 text-gray-500" {...props} />
        ),
        pre: (props) => (
          <pre
            className="mb-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100 last:mb-0 [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0"
            {...props}
          />
        ),
        code: (props) => (
          <code className="rounded bg-gray-200/70 px-1 py-0.5 font-mono text-[0.85em]" {...props} />
        ),
        table: (props) => (
          <div className="mb-2 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-xs" {...props} />
          </div>
        ),
        th: (props) => <th className="border-b border-gray-300 px-2 py-1 font-semibold" {...props} />,
        td: (props) => <td className="border-b border-gray-100 px-2 py-1" {...props} />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export function ModuleChat({
  moduleId,
  code,
  lastResults,
}: {
  moduleId: string;
  code?: string;
  lastResults?: string;
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

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[520px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-[#233242]">AI Tutor</p>
        <p className="text-xs text-gray-400">Knows this module — ask anything about it</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <p className="text-base font-semibold text-[#233242]">What are you stuck on?</p>
            <p className="mt-1 text-sm text-gray-400">Ask the tutor anything about this module.</p>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="ml-auto w-fit max-w-[85%] rounded-3xl bg-gray-100 px-4 py-2 text-sm whitespace-pre-wrap text-[#233242]"
            >
              {m.content}
            </div>
          ) : (
            <div key={i} className="text-sm text-[#233242]">
              {m.content ? (
                <Markdown text={m.content} />
              ) : busy && i === messages.length - 1 ? (
                <span className="mt-1 inline-block h-3 w-3 animate-pulse rounded-full bg-gray-700" />
              ) : null}
            </div>
          ),
        )}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-red-600">{error}</p>}

      <div className="p-3">
        <div className="flex items-end gap-2 rounded-3xl border border-gray-300 px-4 py-2 transition-colors focus-within:border-gray-400">
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
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm text-[#233242] placeholder:text-gray-400 focus:outline-none"
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
