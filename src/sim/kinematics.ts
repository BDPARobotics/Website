// MaxArm forward/inverse kinematics, ported directly from the real firmware
// (_espmax.cpp / ESPMax.cpp in Hiwonder's official curriculum) rather than
// re-derived — verified round-trip accurate (<0.001mm) against known points.
//
// Coordinate system: origin at the arm's base center, millimeters. Z is
// INVERTED — negative = up, positive = down — matching the real hardware.
// No DOM/React/Firebase imports here; this file must stay safe to import
// from a Web Worker (or, later, a headless server re-validation pass).

export const LINK = {
  L0: 84.4,
  L1: 8.14,
  L2: 128.4,
  L3: 138.0,
  L4: 16.8,
} as const;

const L2_SQ = LINK.L2 * LINK.L2;
const L3_SQ = LINK.L3 * LINK.L3;
const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export type Vec3 = [number, number, number];

// The 3 bus-servo joint angles (degrees): base rotation, then the two
// arm-link angles. There is no independent wrist joint — this triple fully
// determines the end-effector's XYZ position, not its orientation.
export type JointAngles = Vec3;

export const REACH_LIMITS = {
  maxZ: 255, // arm cannot reach past ~255mm "down" (positive Z)
  minRadiusXY: 50, // ~50mm dead zone directly above the base it can't reach into
} as const;

export const HOME_POSITION: Vec3 = [0, -(LINK.L1 + LINK.L3 + LINK.L4), LINK.L0 + LINK.L2];

export class UnreachablePositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnreachablePositionError";
  }
}

/** Given the 3 joint angles (degrees), returns the end-effector position (mm). */
export function forward([j1, j2, j3]: JointAngles): Vec3 {
  let alpha1 = j1 * DEG_TO_RAD;
  const alpha2 = j2 * DEG_TO_RAD;
  const alpha3 = j3 * DEG_TO_RAD;
  alpha1 += 150 * DEG_TO_RAD;
  if (alpha1 > TWO_PI) alpha1 -= TWO_PI;

  const beta = alpha2 - alpha3;
  const sideBeta = Math.sqrt(L2_SQ + L3_SQ - 2 * LINK.L2 * LINK.L3 * Math.cos(beta));
  let cosGamma = (sideBeta * sideBeta + L2_SQ - L3_SQ) / (2 * sideBeta * LINK.L2);
  if (cosGamma > 1) cosGamma = 1;
  const gamma = Math.acos(cosGamma);
  const alphaGamma = Math.PI - alpha2;
  const alpha = alphaGamma - gamma;

  let z = sideBeta * Math.sin(alpha);
  let r = Math.sqrt(sideBeta * sideBeta - z * z);
  z += LINK.L0;
  r += LINK.L1 + LINK.L4;

  const x = r * Math.cos(alpha1);
  const y = r * Math.sin(alpha1);
  return [-x, y, z];
}

/**
 * Given a target end-effector position (mm), returns the 3 joint angles
 * (degrees) that reach it. Throws UnreachablePositionError if the position
 * is outside the arm's kinematic reach (distinct from the physical
 * REACH_LIMITS checked by `validatePosition`, which callers should apply
 * first — this catches the remaining geometrically-unreachable case, an
 * out-of-domain acos that would silently produce NaN in the original C++).
 */
export function inverse([px, py, pz]: Vec3): JointAngles {
  const x = -px;
  const y = py;
  let z = pz;

  let theta1: number;
  if (x === 0) {
    theta1 = y >= 0 ? Math.PI / 2 : (Math.PI / 2) * 3;
  } else if (y === 0) {
    theta1 = x > 0 ? 0 : Math.PI;
  } else if (x < 0) {
    theta1 = Math.atan(y / x) + Math.PI;
  } else {
    theta1 = Math.atan(y / x) + TWO_PI;
  }

  const r = Math.sqrt(x * x + y * y) - LINK.L1 - LINK.L4;
  z = z - LINK.L0;

  const reachSq = r * r + z * z;
  if (Math.sqrt(reachSq) > LINK.L2 + LINK.L3) {
    throw new UnreachablePositionError(
      `Target is beyond the arm's reach (r=${r.toFixed(1)}mm, z=${z.toFixed(1)}mm).`,
    );
  }

  const betaArg = (L2_SQ + L3_SQ - reachSq) / (2 * LINK.L2 * LINK.L3);
  const gammaArg = (L2_SQ + (reachSq - L3_SQ)) / (2 * LINK.L2 * Math.sqrt(reachSq));
  if (betaArg < -1 || betaArg > 1 || gammaArg < -1 || gammaArg > 1) {
    throw new UnreachablePositionError("Target is inside the arm's unreachable dead zone.");
  }
  const beta = Math.acos(betaArg);
  const gamma = Math.acos(gammaArg);
  const alpha = Math.atan(z / r);
  const theta2 = Math.PI - (alpha + gamma);
  const theta3 = Math.PI - (alpha + beta + gamma);

  let angles = theta1 * RAD_TO_DEG;
  if (angles <= 30) angles += 360;
  const angle1 = angles - 150;
  const angle2 = theta2 * RAD_TO_DEG;
  const angle3 = theta3 * RAD_TO_DEG;
  return [angle1, angle2, angle3];
}

/**
 * Applies the same physical limits as the real firmware's set_position():
 * Z is clamped (not rejected) to maxZ; a target inside the base dead zone
 * is rejected outright. Returns the (possibly Z-clamped) position, or
 * throws UnreachablePositionError.
 */
export function validatePosition([x, y, z]: Vec3): Vec3 {
  const clampedZ = Math.min(z, REACH_LIMITS.maxZ);
  const radius = Math.sqrt(x * x + y * y);
  if (radius < REACH_LIMITS.minRadiusXY) {
    throw new UnreachablePositionError(
      `Target (${x}, ${y}, ${z}) is within the ${REACH_LIMITS.minRadiusXY}mm dead zone directly above the base.`,
    );
  }
  return [x, y, clampedZ];
}
