import type { Module } from "@/lib/types";

// The RACC competition kit. Described at the level the curriculum teaches —
// the tutor reasons from the student's own code rather than a made-up API.
// Sourced from Hiwonder's official MaxArm curriculum (lesson code + kinematics
// library), not the general event rule sheets, so these specifics are exact.
export const MAXARM_REFERENCE = `
The competition kit is the Hiwonder MaxArm: an open-source robot arm driven by an ESP32
microcontroller. Students program it in Arduino C++ or MicroPython.
Sensors wired to the ESP32: ultrasonic (distance), color, sound, and touch.

Hardware model — get this right, it's a common source of student confusion:
- 3 bus servos (serial, IDs 1-3) are solved together via inverse kinematics for a single
  XYZ position: ID1 = base rotation, ID2/ID3 = the two arm-link angles. There is no wrist
  joint — the IK solve controls position only, not end-effector orientation.
- 1 separate PWM servo tilts the end effector. It is NOT part of the IK solve and is driven
  directly (e.g. SetPWMServo(port, pulse, duration)).
- The end effector is a VACUUM SUCTION NOZZLE (air pump + solenoid valve), not a mechanical
  claw or gripper. Typical API: Pump_on() to grip (builds vacuum), Valve_on() then Valve_off()
  to release (opens then closes the valve). If a student says "gripper" or "claw", they likely
  mean the suction nozzle — gently correct the terminology.
- Core movement call: set_position(pos[3], duration_ms) where pos = {x, y, z} in millimeters,
  origin at the base center. Z is inverted: negative = up, positive = down. The arm cannot
  reach z above ~255mm (down) or within ~50mm of the base horizontally (a dead zone directly
  above the base) — "arm won't move" bugs are often the target position violating one of
  these limits, not a code logic error.
- Bus servos: BusServo.LobotSerialServoMove(id, pulse, duration_ms), pulse range 0-1000 (≈240°
  of travel). PWM servo pulse range is roughly 500-2500µs (≈0-180°).

Typical challenge work: pick-and-place on the challenge grid mat, stacking, sensor-triggered
behaviors, and full autonomous or manually-controlled (teleoperated) sequences.
Match whichever language the student is working in (Arduino C++ or MicroPython), and when
debugging think about the physical realities: servo ranges and safety limits above, sensor
wiring/pins, timing, and repeatability on the mat.`;

export function buildTutorSystemPrompt(
  moduleDoc: Pick<Module, "title" | "type" | "aiContext">,
  extra?: { code?: string; codeOrigin?: string; lastResults?: string },
): string {
  const parts = [
    `You are the BDPA Robotics AI tutor. You are embedded inside the learning module "${moduleDoc.title}" and you help students (mostly middle/high schoolers) work through it.`,
    `Module context (what this module teaches):\n${moduleDoc.aiContext || "(the author has not provided extra context — rely on the student's questions)"}`,
    `Guidelines:
- Be encouraging and concise. Explain concepts step by step at a student's level.
- Guide with hints and questions before giving answers; never dump a full solution unless the student is clearly stuck after multiple attempts.
- Stay scoped to this module's topic. If asked about unrelated things, gently steer back — unless the student explicitly wants to explore related robotics ideas.
- Use plain language; define jargon when you use it.`,
  ];

  if (moduleDoc.type === "arm_challenge") {
    parts.push(`This is a Robot Arm Coding Competition (RACC) challenge module.${MAXARM_REFERENCE}`);
    if (extra?.code) {
      parts.push(
        `The student's code (${extra.codeOrigin ?? "current working copy"}):\n\`\`\`\n${extra.code.slice(0, 8000)}\n\`\`\``,
      );
    } else {
      parts.push("The student has not submitted any code yet.");
    }
    if (extra?.lastResults) {
      parts.push(`Their last run results:\n${extra.lastResults.slice(0, 2000)}`);
    }
    parts.push(
      "Help them debug their own code — point at the specific line or logic that's wrong and explain why, but let them write the fix.",
    );
  }

  return parts.join("\n\n");
}
