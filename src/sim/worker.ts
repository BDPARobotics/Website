// Web Worker entry point: runs student code against the simulation engine
// and posts back the full event list (or an error) in one message. The
// cooperative in-engine budget (BudgetExceededError) handles code that
// calls the arm API a lot; it CANNOT interrupt a pure synchronous busy-loop
// (e.g. `while(true){}`) that never calls into the API — the caller on the
// main thread is responsible for a wall-clock `worker.terminate()` backstop
// for that case (see components/arm-simulator/ArmSimulator.tsx).
import { runSimulation, StudentCodeError, BudgetExceededError } from "./engine";
import { gradeAllTests } from "./autograder";
import type { SceneConfig, SolutionTest, TestResult } from "@/lib/types";

export interface RunMessage {
  code: string;
  sceneConfig: SceneConfig;
  solutionTests?: SolutionTest[];
}

export type WorkerResponse =
  | { ok: true; events: import("./engine").SimEvent[]; loopCallCount: number; testResults: TestResult[] }
  | { ok: false; error: string };

self.onmessage = (e: MessageEvent<RunMessage>) => {
  const { code, sceneConfig, solutionTests } = e.data;
  try {
    const result = runSimulation(code, sceneConfig);
    const testResults = solutionTests?.length ? gradeAllTests(code, solutionTests) : [];
    const response: WorkerResponse = {
      ok: true,
      events: result.events,
      loopCallCount: result.loopCallCount,
      testResults,
    };
    self.postMessage(response);
  } catch (err) {
    const message =
      err instanceof StudentCodeError || err instanceof BudgetExceededError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    const response: WorkerResponse = { ok: false, error: message };
    self.postMessage(response);
  }
};
