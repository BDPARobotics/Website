"use client";

import { useState } from "react";
import type { ContentBlock, Module } from "@/lib/types";

type EditableBlock = {
  type: "text" | "code" | "image" | "video" | "pdf";
  content: string;
  url: string;
  language: string;
  alt: string;
};

function toEditable(blocks: ContentBlock[]): EditableBlock[] {
  return blocks.map((b) => ({
    type: b.type,
    content: "content" in b ? b.content : "",
    url: "url" in b ? b.url : "",
    language: b.type === "code" ? (b.language ?? "") : "",
    alt: b.type === "image" ? (b.alt ?? "") : "",
  }));
}

function fromEditable(blocks: EditableBlock[]) {
  return blocks.map((b) => {
    if (b.type === "text") return { type: "text", content: b.content };
    if (b.type === "code") return { type: "code", content: b.content, language: b.language || undefined };
    if (b.type === "image") return { type: "image", url: b.url, alt: b.alt || undefined };
    return { type: b.type, url: b.url };
  });
}

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function ModuleEditor({ moduleId, initial }: { moduleId: string; initial: Module }) {
  const [title, setTitle] = useState(initial.title);
  const [order, setOrder] = useState(String(initial.order));
  const [type, setType] = useState(initial.type);
  const [aiContext, setAiContext] = useState(initial.aiContext);
  const [blocks, setBlocks] = useState<EditableBlock[]>(toEditable(initial.contentBlocks));
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  async function uploadFile(i: number, file: File) {
    setStatus(null);
    setUploadingIndex(i);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
    setUploadingIndex(null);
    if (res.ok) {
      const { url } = await res.json();
      updateBlock(i, { url });
      setStatus("File uploaded — remember to save the module.");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(`Upload failed: ${data.error ?? res.status}`);
    }
  }

  function updateBlock(i: number, patch: Partial<EditableBlock>) {
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function save() {
    setStatus(null);
    setBusy(true);
    const res = await fetch(`/api/admin/modules/${moduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        order: Number(order),
        type,
        aiContext,
        contentBlocks: fromEditable(blocks),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setStatus("Saved.");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus(`Save failed: ${data.error ?? res.status}`);
    }
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Title
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Order
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className={`${inputCls} w-24`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Module["type"])}
            className={inputCls}
          >
            <option value="content">Content</option>
            <option value="arm_challenge">Robot arm challenge</option>
          </select>
        </div>
      </div>

      {type === "arm_challenge" && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Robot arm challenge configuration (scene, tests, starter code) is coming with the
          simulator build — for now this module type behaves like a content module.
        </p>
      )}

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          AI tutor context
        </label>
        <p className="mt-1 text-xs text-gray-400">
          Condensed summary of this module injected into the AI assistant&apos;s prompt. Write what
          the tutor needs to know to help a student through this module.
        </p>
        <textarea
          value={aiContext}
          onChange={(e) => setAiContext(e.target.value)}
          rows={6}
          className={`${inputCls} mt-2 font-mono`}
        />
      </div>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Content blocks
        </h3>
        <div className="mt-2 space-y-3">
          {blocks.map((b, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={b.type}
                  onChange={(e) => updateBlock(i, { type: e.target.value as EditableBlock["type"] })}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="code">Code</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                </select>
                <div className="flex gap-1 text-xs">
                  <button type="button" onClick={() => moveBlock(i, -1)} className="rounded border border-gray-300 px-2 py-1 hover:border-primary">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveBlock(i, 1)} className="rounded border border-gray-300 px-2 py-1 hover:border-primary">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlocks((bs) => bs.filter((_, j) => j !== i))}
                    className="rounded border border-gray-300 px-2 py-1 text-red-600 hover:border-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {(b.type === "text" || b.type === "code") && (
                  <textarea
                    value={b.content}
                    onChange={(e) => updateBlock(i, { content: e.target.value })}
                    rows={b.type === "code" ? 8 : 5}
                    placeholder={b.type === "code" ? "// code sample" : "Markdown text…"}
                    className={`${inputCls} ${b.type === "code" ? "font-mono" : ""}`}
                  />
                )}
                {b.type === "code" && (
                  <input
                    value={b.language}
                    onChange={(e) => updateBlock(i, { language: e.target.value })}
                    placeholder="Language (e.g. javascript)"
                    className={`${inputCls} w-60`}
                  />
                )}
                {(b.type === "image" || b.type === "video" || b.type === "pdf") && (
                  <div className="flex items-center gap-2">
                    <input
                      value={b.url}
                      onChange={(e) => updateBlock(i, { url: e.target.value })}
                      placeholder="https:// URL — or upload a file"
                      className={inputCls}
                    />
                    <label
                      className={`shrink-0 cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-[#233242] hover:border-primary ${
                        uploadingIndex === i ? "opacity-60" : ""
                      }`}
                    >
                      {uploadingIndex === i ? "Uploading…" : "Upload"}
                      <input
                        type="file"
                        hidden
                        disabled={uploadingIndex !== null}
                        accept={
                          b.type === "pdf"
                            ? "application/pdf"
                            : b.type === "video"
                              ? "video/mp4"
                              : "image/png,image/jpeg,image/gif,image/webp"
                        }
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadFile(i, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
                {b.type === "image" && (
                  <input
                    value={b.alt}
                    onChange={(e) => updateBlock(i, { alt: e.target.value })}
                    placeholder="Alt text"
                    className={inputCls}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setBlocks((bs) => [...bs, { type: "text", content: "", url: "", language: "", alt: "" }])
          }
          className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-[#233242] hover:border-primary"
        >
          + Add block
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save module"}
        </button>
        {status && (
          <span className={`text-sm ${status === "Saved." ? "text-green-600" : "text-red-600"}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
