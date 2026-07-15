// Pure, no-DOM simulation engine: runs a student's setup()/loop() JavaScript
// against the arm API and a scene, producing a sparse event list. Designed
// to run inside a Web Worker (see worker.ts) or, later, headless server-side
// for re-validation — this file must never import React/DOM/Firebase.
import { forward, inverse, validatePosition, HOME_POSITION, type Vec3, type JointAngles } from "./kinematics";
import type { SceneConfig, SceneObject } from "@/lib/types";

export type SimEvent =
  | { type: "move"; fromAngles: JointAngles; toAngles: JointAngles; tStart: number; tEnd: number }
  | { type: "pump"; t: number; attachedObjectId: string | null }
  | { type: "valveOn"; t: number; releasedObjectId: string | null; releasePosition: Vec3 | null }
  | { type: "valveOff"; t: number }
  | { type: "pwm"; t: number; pulse: number; durationMs: number }
  | { type: "log"; t: number; text: string };

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export class StudentCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentCodeError";
  }
}

export interface SimResult {
  events: SimEvent[];
  loopCallCount: number;
  finalObjectPositions: Record<string, Vec3>;
}

const DEFAULT_MAX_SIM_SECONDS = 120;
const DEFAULT_MAX_EVENTS = 500;
const DEFAULT_MAX_LOOP_CALLS = 500;

function initialAngles(armStart: Record<string, number> | undefined): JointAngles {
  if (armStart && "base" in armStart && "shoulder" in armStart && "elbow" in armStart) {
    return [armStart.base, armStart.shoulder, armStart.elbow];
  }
  return inverse(HOME_POSITION);
}

function distance3(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function runSimulation(
  code: string,
  sceneConfig: SceneConfig,
  options?: { maxSimSeconds?: number; maxEvents?: number; maxLoopCalls?: number },
): SimResult {
  const maxSimSeconds = options?.maxSimSeconds ?? DEFAULT_MAX_SIM_SECONDS;
  const maxEvents = options?.maxEvents ?? DEFAULT_MAX_EVENTS;
  const maxLoopCalls = options?.maxLoopCalls ?? DEFAULT_MAX_LOOP_CALLS;

  const events: SimEvent[] = [];
  let simTimeMs = 0;
  let currentAngles = initialAngles(sceneConfig.armStart);
  let currentPos = forward(currentAngles);
  let heldObjectId: string | null = null;

  const status = new Map<string, "pending" | "held" | "placed">();
  const initialPositions = new Map<string, Vec3>();
  for (const obj of sceneConfig.objects) {
    status.set(obj.id, "pending");
    initialPositions.set(obj.id, obj.position);
  }
  const sensorOrigin: Vec3 = sceneConfig.sensorOrigin ?? [0, 0, 0];

  function checkBudget() {
    if (events.length >= maxEvents) {
      throw new BudgetExceededError(`Exceeded the ${maxEvents}-event limit for one run.`);
    }
    if (simTimeMs > maxSimSeconds * 1000) {
      throw new BudgetExceededError(`Exceeded the ${maxSimSeconds}-simulated-second limit for one run.`);
    }
  }

  function nearestPendingObject(): SceneObject | null {
    let nearest: SceneObject | null = null;
    let nearestDist = Infinity;
    for (const obj of sceneConfig.objects) {
      if (status.get(obj.id) !== "pending") continue;
      const d = distance3(currentPos, initialPositions.get(obj.id)!);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = obj;
      }
    }
    if (nearest && nearestDist <= nearest.size / 2 + 15) return nearest;
    return null;
  }

  const api = {
    setPosition(x: number, y: number, z: number, durationMs: number) {
      checkBudget();
      const validated = validatePosition([x, y, z]);
      const toAngles = inverse(validated);
      events.push({ type: "move", fromAngles: currentAngles, toAngles, tStart: simTimeMs, tEnd: simTimeMs + durationMs });
      currentAngles = toAngles;
      currentPos = validated;
    },
    pumpOn() {
      checkBudget();
      let attachedObjectId: string | null = null;
      if (!heldObjectId) {
        const target = nearestPendingObject();
        if (target) {
          status.set(target.id, "held");
          heldObjectId = target.id;
          attachedObjectId = target.id;
        }
      }
      events.push({ type: "pump", t: simTimeMs, attachedObjectId });
    },
    valveOn() {
      checkBudget();
      let releasedObjectId: string | null = null;
      let releasePosition: Vec3 | null = null;
      if (heldObjectId) {
        status.set(heldObjectId, "placed");
        releasedObjectId = heldObjectId;
        releasePosition = currentPos;
        heldObjectId = null;
      }
      events.push({ type: "valveOn", t: simTimeMs, releasedObjectId, releasePosition });
    },
    valveOff() {
      checkBudget();
      events.push({ type: "valveOff", t: simTimeMs });
    },
    setPwmServo(pulse: number, durationMs: number) {
      checkBudget();
      events.push({ type: "pwm", t: simTimeMs, pulse, durationMs });
    },
    getDistance(): number {
      const target = nearestPendingObject();
      return target ? distance3(sensorOrigin, initialPositions.get(target.id)!) : 9999;
    },
    getColor(): string | null {
      const target = nearestPendingObject();
      return target?.color ?? null;
    },
    delay(ms: number) {
      simTimeMs += ms;
      checkBudget();
    },
  };

  const logFn = (text: string) => events.push({ type: "log", t: simTimeMs, text });

  let compiled: { setup: (() => void) | null; loop: (() => void) | null };
  try {
    // Flat global API, matching the naming students already see in lesson
    // code — deliberately not sandboxed against a determined bad actor (see
    // src/sim/README notes in the plan): this only ever runs in the
    // student's own tab for their own feedback, never trusted server-side.
    const factory = new Function(
      "setPosition",
      "pumpOn",
      "valveOn",
      "valveOff",
      "setPwmServo",
      "getDistance",
      "getColor",
      "delay",
      "console",
      `"use strict";\n${code}\nreturn { setup: typeof setup === "function" ? setup : null, loop: typeof loop === "function" ? loop : null };`,
    );
    compiled = factory(
      api.setPosition,
      api.pumpOn,
      api.valveOn,
      api.valveOff,
      api.setPwmServo,
      api.getDistance,
      api.getColor,
      api.delay,
      { log: (...args: unknown[]) => logFn(args.map(String).join(" ")) },
    );
  } catch (err) {
    throw new StudentCodeError(err instanceof Error ? err.message : String(err));
  }

  if (!compiled.loop) {
    throw new StudentCodeError("Your code must define a loop() function.");
  }

  try {
    compiled.setup?.();
  } catch (err) {
    if (err instanceof BudgetExceededError) throw err;
    throw new StudentCodeError(`Error in setup(): ${err instanceof Error ? err.message : String(err)}`);
  }

  let loopCallCount = 0;
  try {
    while (loopCallCount < maxLoopCalls) {
      checkBudget();
      compiled.loop();
      loopCallCount += 1;
    }
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      // Graceful stop, not a failure — the recorded events up to this point are still valid.
    } else {
      throw new StudentCodeError(`Error in loop(): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const finalObjectPositions: Record<string, Vec3> = {};
  for (const obj of sceneConfig.objects) {
    finalObjectPositions[obj.id] = initialPositions.get(obj.id)!;
  }
  for (const e of events) {
    if (e.type === "valveOn" && e.releasedObjectId && e.releasePosition) {
      finalObjectPositions[e.releasedObjectId] = e.releasePosition;
    }
  }

  return { events, loopCallCount, finalObjectPositions };
}
