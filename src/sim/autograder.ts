// Grades a submission's SolutionTests by re-running the student's code
// against each test's own initial scene and checking the success condition
// against the resulting event list. Pure, no-DOM — safe to call from
// worker.ts (where it runs alongside the main playback simulation) or,
// later, a headless server-side re-validation pass.
import { runSimulation, StudentCodeError, BudgetExceededError } from "./engine";
import type { SimEvent } from "./engine";
import type { Vec3 } from "./kinematics";
import type { SolutionTest, TestResult } from "@/lib/types";

function distance3(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

const MOVE_EVENT_TYPES = new Set(["move", "pump", "valveOn", "valveOff", "pwm"]);

/** Grades one test given the event list from running the code against test.initialState. */
export function gradeTestRun(events: SimEvent[], test: SolutionTest): TestResult {
  const zone = test.initialState.targetZones.find((z) => z.id === test.successCondition.targetZone);
  if (!zone) return { testId: test.id, passed: false, moves: 0, timeSec: 0 };

  let moves = 0;
  for (const e of events) {
    if (MOVE_EVENT_TYPES.has(e.type)) moves += 1;

    if (e.type === "valveOn" && e.releasedObjectId === test.successCondition.objectId && e.releasePosition) {
      const timeSec = e.t / 1000;
      const withinZone = distance3(e.releasePosition, zone.position) <= zone.radius;
      const withinTime = timeSec <= test.successCondition.maxTimeSec;
      const withinMoves =
        test.successCondition.maxMoves == null || moves <= test.successCondition.maxMoves;

      if (withinZone && withinTime && withinMoves) {
        return { testId: test.id, passed: true, moves, timeSec };
      }
      // Placed, but missed the zone/time/move budget — keep scanning in case
      // the student's code re-picks and re-places the same object later.
    }
  }
  return { testId: test.id, passed: false, moves, timeSec: 0 };
}

/** Runs the student's code once per test (each against its own initial scene) and grades all of them. */
export function gradeAllTests(code: string, tests: SolutionTest[]): TestResult[] {
  return tests.map((test) => {
    try {
      const { events } = runSimulation(code, test.initialState);
      return gradeTestRun(events, test);
    } catch (err) {
      // A StudentCodeError/BudgetExceededError on a given test's scene just
      // means that test failed to run to completion — treat as not passed.
      void (err instanceof StudentCodeError || err instanceof BudgetExceededError);
      return { testId: test.id, passed: false, moves: 0, timeSec: 0 };
    }
  });
}
