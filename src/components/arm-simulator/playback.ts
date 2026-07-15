// Pure helpers for deriving "what does the scene look like at time t" from a
// recorded SimEvent list — used by Scene.tsx to interpolate/replay a run.
import type { SimEvent } from "@/sim/engine";
import type { JointAngles, Vec3 } from "@/sim/kinematics";
import { forward } from "@/sim/kinematics";

function eventTime(e: SimEvent): number {
  return e.type === "move" ? e.tEnd : e.t;
}

export function getAnglesAtTime(events: SimEvent[], t: number): JointAngles {
  const moves = events.filter((e): e is Extract<SimEvent, { type: "move" }> => e.type === "move");
  if (moves.length === 0) return [120, 90, 0]; // matches the home-position angles

  for (const move of moves) {
    if (t < move.tStart) return move.fromAngles;
    if (t <= move.tEnd) {
      const span = move.tEnd - move.tStart;
      const frac = span > 0 ? (t - move.tStart) / span : 1;
      return [
        move.fromAngles[0] + (move.toAngles[0] - move.fromAngles[0]) * frac,
        move.fromAngles[1] + (move.toAngles[1] - move.fromAngles[1]) * frac,
        move.fromAngles[2] + (move.toAngles[2] - move.fromAngles[2]) * frac,
      ];
    }
  }
  return moves[moves.length - 1].toAngles;
}

export function getEndEffectorPositionAtTime(events: SimEvent[], t: number): Vec3 {
  return forward(getAnglesAtTime(events, t));
}

/** Which object (if any) is attached to the end effector at time t. */
export function getHeldObjectIdAtTime(events: SimEvent[], t: number): string | null {
  let held: string | null = null;
  for (const e of events) {
    if (eventTime(e) > t) break;
    if (e.type === "pump" && e.attachedObjectId) held = e.attachedObjectId;
    if (e.type === "valveOn" && e.releasedObjectId === held) held = null;
  }
  return held;
}

/** Where object `id` is at time t: initial position, following the end effector, or frozen at release. */
export function getObjectPositionAtTime(
  events: SimEvent[],
  objectId: string,
  initialPosition: Vec3,
  t: number,
): Vec3 {
  let releasePosition: Vec3 | null = null;
  let held = false;
  for (const e of events) {
    if (eventTime(e) > t) break;
    if (e.type === "pump" && e.attachedObjectId === objectId) held = true;
    if (e.type === "valveOn" && e.releasedObjectId === objectId) {
      held = false;
      releasePosition = e.releasePosition;
    }
  }
  if (held) return getEndEffectorPositionAtTime(events, t);
  if (releasePosition) return releasePosition;
  return initialPosition;
}

export function getTotalDurationMs(events: SimEvent[]): number {
  let max = 0;
  for (const e of events) {
    const t = eventTime(e);
    if (t > max) max = t;
  }
  return max;
}
