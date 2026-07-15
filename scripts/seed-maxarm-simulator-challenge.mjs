// Seeds one real, playable ArmChallenge (scene + starter code + tests) onto
// the "Ultrasonic Detection + Suction Pickup" Robotic Arm Academy module —
// the first worked example of the in-browser simulator (Phase 4). Matches
// the pick-and-place coordinates used in that module's own reference code.
// Idempotent: skips if the module already has an armChallenge.
// Usage: node --env-file=.env.local scripts/seed-maxarm-simulator-challenge.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "null");
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
  process.exit(1);
}

initializeApp({ credential: cert(key) });
const db = getFirestore();

const SCENE_CONFIG = {
  objects: [{ id: "block1", shape: "cube", position: [0, -160, 85], size: 30, color: "#c0392b" }],
  targetZones: [{ id: "dropZone", position: [70, -150, 90], radius: 40 }],
  armStart: {},
  sensorOrigin: [0, -160, 400],
};

const STARTER_CODE = `// Ultrasonic Detection + Suction Pickup
// The block sits in front of the arm. Use getDistance() to find it, then
// pick it up and move it to the drop zone.
//
// Available functions: setPosition(x, y, z, durationMs), pumpOn(), valveOn(),
// valveOff(), setPwmServo(pulse, durationMs), getDistance(), getColor(), delay(ms).
// Remember: Z is inverted on this arm — negative is UP, positive is DOWN.

function setup() {
  // Move to a safe position above the block first.
  setPosition(0, -160, 100, 1500);
  delay(1500);
}

let done = false;

function loop() {
  if (done) {
    delay(500);
    return;
  }

  const distance = getDistance();
  console.log("distance:", distance);

  // TODO: when the block is within range (roughly 60-80mm), descend, turn
  // on the pump to pick it up, lift, move to the drop zone (around x=70,
  // y=-150), lower, release with valveOn()/valveOff(), and set done = true.
}
`;

const SOLUTION_TESTS = [
  {
    id: "picks-up-and-places-block",
    description: "Pick up block1 and place it in the drop zone within 20 seconds.",
    initialState: SCENE_CONFIG,
    successCondition: { objectId: "block1", targetZone: "dropZone", maxTimeSec: 20 },
  },
];

const moduleSnap = await db
  .collection("modules")
  .where("title", "==", "Ultrasonic Detection + Suction Pickup")
  .limit(1)
  .get();

if (moduleSnap.empty) {
  console.error('Module "Ultrasonic Detection + Suction Pickup" not found — run the curriculum seed script first.');
  process.exit(1);
}

const moduleDoc = moduleSnap.docs[0];
const existing = moduleDoc.data();

if (existing.armChallenge) {
  console.log(`skip — module ${moduleDoc.id} already has an armChallenge`);
  process.exit(0);
}

await moduleDoc.ref.update({
  // Promote to "arm_challenge" so the existing type-gated UI (simulator,
  // submission form, "Robot Arm Challenge" badge) picks it up consistently —
  // it now genuinely has interactive challenge content, not just a reading.
  type: "arm_challenge",
  armChallenge: {
    sceneConfig: SCENE_CONFIG,
    starterCode: STARTER_CODE,
    solutionTests: SOLUTION_TESTS,
    difficulty: "intro",
    timeLimitSec: 60,
  },
});

console.log(`seeded armChallenge onto module ${moduleDoc.id} ("${existing.title}")`);
