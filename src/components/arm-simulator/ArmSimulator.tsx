"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { getTotalDurationMs } from "./playback";
import type { SimEvent } from "@/sim/engine";
import type { WorkerResponse } from "@/sim/worker";
import type { ArmChallenge, TestResult } from "@/lib/types";

const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), { ssr: false });

// Wall-clock backstop: the worker's own in-engine budget only catches code
// that calls the arm API a lot. A pure `while(true){}` never yields, so this
// timeout — not the engine — is what stops it from freezing the tab forever.
const RUN_TIMEOUT_MS = 6000;

type Status = "idle" | "running" | "done" | "error";

export function ArmSimulator({
  challenge,
  onRunComplete,
}: {
  challenge: ArmChallenge;
  onRunComplete?: (result: { code: string; passed: boolean; summary: string }) => void;
}) {
  const [code, setCode] = useState(challenge.starterCode);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [playbackTimeMs, setPlaybackTimeMs] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startPlayback = useCallback(
    (recordedEvents: SimEvent[]) => {
      stopPlayback();
      const total = getTotalDurationMs(recordedEvents);
      if (total <= 0) {
        setPlaybackTimeMs(0);
        return;
      }
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        setPlaybackTimeMs(Math.min(elapsed, total));
        if (elapsed < total) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [stopPlayback],
  );

  const run = useCallback(() => {
    stopPlayback();
    workerRef.current?.terminate();

    setStatus("running");
    setError(null);
    setEvents([]);
    setTestResults([]);
    setPlaybackTimeMs(0);

    const worker = new Worker(new URL("../../sim/worker.ts", import.meta.url));
    workerRef.current = worker;

    const timeout = setTimeout(() => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      setStatus("error");
      setError("Your code took too long to run (likely an infinite loop) and was stopped.");
    }, RUN_TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeout);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;

      if (e.data.ok) {
        setEvents(e.data.events);
        setTestResults(e.data.testResults);
        setStatus("done");
        startPlayback(e.data.events);
        const passed = e.data.testResults.length > 0 && e.data.testResults.every((r) => r.passed);
        const summary =
          e.data.testResults.length === 0
            ? "Ran successfully (no tests defined for this challenge)."
            : `${e.data.testResults.filter((r) => r.passed).length}/${e.data.testResults.length} tests passed.`;
        onRunComplete?.({ code, passed, summary });
      } else {
        setStatus("error");
        setError(e.data.error);
      }
    };

    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      setStatus("error");
      setError(e.message || "The simulator crashed unexpectedly.");
    };

    worker.postMessage({ code, sceneConfig: challenge.sceneConfig, solutionTests: challenge.solutionTests });
  }, [code, challenge, onRunComplete, startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      workerRef.current?.terminate();
    };
  }, [stopPlayback]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <CodeEditor value={code} onChange={setCode} readOnly={status === "running"} />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={status === "running"}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {status === "running" ? "Running…" : "Run"}
            </button>
            {status === "done" && (
              <span className="text-sm text-gray-500">
                {testResults.every((r) => r.passed) && testResults.length > 0
                  ? "✅ All tests passed"
                  : testResults.length > 0
                    ? `${testResults.filter((r) => r.passed).length}/${testResults.length} tests passed`
                    : "Ran — no tests defined"}
              </span>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {testResults.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {testResults.map((r) => (
                <li key={r.testId} className={r.passed ? "text-green-700" : "text-gray-500"}>
                  {r.passed ? "✅" : "❌"} {r.testId} — {r.moves} moves, {r.timeSec.toFixed(1)}s
                </li>
              ))}
            </ul>
          )}
        </div>
        <Scene events={events} sceneConfig={challenge.sceneConfig} playbackTimeMs={playbackTimeMs} />
      </div>
    </div>
  );
}
