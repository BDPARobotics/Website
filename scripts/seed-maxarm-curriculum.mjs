// Seeds the real Hiwonder MaxArm curriculum (from the official RACC-2026
// curriculum zip, not paraphrased event-rule docs): two new courses
// ("MaxArm Fundamentals", "Inverse Kinematics"), a full rewrite of
// "Robotic Arm Academy"'s modules, and a content patch on the 3 challenge
// modules in "Robot Arm Coding Competition" (suction, not gripper).
//
// Idempotent: skips creating a course whose title already exists; the
// Academy rewrite only replaces modules if the course is still the old
// 5-module placeholder (checked by count) so re-running doesn't duplicate.
//
// Usage: node --env-file=.env.local scripts/seed-maxarm-curriculum.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "null");
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
  process.exit(1);
}

initializeApp({ credential: cert(key) });
const db = getFirestore();

function text(content) {
  return { type: "text", content };
}
function code(content, language) {
  return { type: "code", content, language };
}

// Deletes a module doc plus its orphaned progress/chat_sessions/submissions —
// same 3 collections + 400-doc batching as src/lib/firebase/cascade.ts.
async function deleteModuleCascade(moduleId) {
  for (const col of ["progress", "chat_sessions", "submissions"]) {
    const snap = await db.collection(col).where("moduleId", "==", moduleId).get();
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await db.collection("modules").doc(moduleId).delete();
}

async function createCourseWithModules(title, description, order, modules) {
  const existing = await db.collection("courses").where("title", "==", title).limit(1).get();
  if (!existing.empty) {
    console.log(`skip "${title}" — already exists (${existing.docs[0].id})`);
    return;
  }
  const courseRef = await db.collection("courses").add({ title, description, order, moduleIds: [] });
  const moduleIds = [];
  for (const [i, m] of modules.entries()) {
    const ref = await db.collection("modules").add({
      courseId: courseRef.id,
      title: m.title,
      order: i + 1,
      type: m.type ?? "content",
      contentBlocks: m.contentBlocks,
      aiContext: m.aiContext,
    });
    moduleIds.push(ref.id);
  }
  await courseRef.update({ moduleIds });
  console.log(`created "${title}" (${courseRef.id}) with ${moduleIds.length} modules`);
}

// ---------------------------------------------------------------------------
// 1. MaxArm Fundamentals (new course) — Section 1, condensed 15 → 8 modules
// ---------------------------------------------------------------------------

const FUNDAMENTALS_MODULES = [
  {
    title: "Meet Your Hardware",
    contentBlocks: [
      text(
        "MaxArm uses two different kinds of servo motors, and knowing which is which will save you a lot of confusion later.\n\n" +
          "- **Bus servos (HTS-35H)** — 35kg·cm of torque, connected in a daisy chain over a single serial (UART) line, each with its own ID (0-253). These are the arm's 3 main joints. Because they're serial, you can also read their live position and input voltage back, not just command them.\n" +
          "- **PWM servos (LFD-01M)** — small, lightweight (9g), controlled the classic way with a pulse-width signal (500-2500µs = 0-180°). MaxArm has one of these, and it's not one of the 3 main arm joints — it tilts the end effector.\n\n" +
          "The brain of the arm is an ESP32 microcontroller: dual-core, WiFi + Bluetooth, with dedicated ports for bus servos, PWM servos, a DC motor, a buzzer, digital I/O, I2C, and USB (which also supports a handheld controller for manual/teleoperated control). You can program it in Arduino C++ or MicroPython — this curriculum uses Arduino C++, with MicroPython equivalents where noted.",
      ),
    ],
    aiContext:
      "Orientation module: bus servos (3 main arm joints, serial, IDs 0-253, position-readable) vs PWM servos (1 nozzle-tilt servo, classic pulse-width control) on an ESP32 controller. No code yet — just get the vocabulary straight before the next modules.",
  },
  {
    title: "PWM Servos: The Nozzle's Tilt",
    contentBlocks: [
      text(
        "The one PWM servo on MaxArm tilts the suction nozzle. It's controlled with a single function, and the pulse-to-angle math is a straight line: `pulse = 11.1 × angle + 500`.\n\n" +
          "The `duration` argument doesn't set a speed directly — it sets how long the whole move should take, so a longer duration means a slower, smoother motion. Calling it again with a different port number lets you address a second PWM servo if one is attached.",
      ),
      code(
        `#include "ESP32PWMServo.h"

void setup() {
  PWMServo_init(); // initialize the PWM servo library
  Serial.begin(9600);
}

void loop() {
  SetPWMServo(1, 500, 2000);   // port 1 to pulse 500 (near 0°), over 2000ms
  delay(2200);
  SetPWMServo(1, 2500, 500);   // port 1 to pulse 2500 (near 180°), over just 500ms — much faster
  delay(700);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Student is calling SetPWMServo(port, pulse, duration_ms) for the first time. pulse ≈ 11.1×angle + 500, range roughly 500-2500. duration controls speed (longer = slower), not a separate speed parameter. Common mistake: expecting a 'speed' argument instead of realizing duration does that job.",
  },
  {
    title: "Bus Servos: The Arm's Joints",
    contentBlocks: [
      text(
        "The 3 bus servos are the arm's actual joints (base rotation, and the two arm-link joints), addressed by ID (1, 2, 3) over the serial bus. Their pulse-to-angle relationship is steeper than the PWM servo's: `pulse ≈ 4.2 × angle`, over a 0-1000 range (about 240° of travel).\n\n" +
          "Because they're serial, not just PWM, you can also read a bus servo's live position and supply voltage back — useful for confirming a move actually completed, or for building your own safety checks.\n\n" +
          "You'll rarely command these 3 servos directly once you get to the Inverse Kinematics course — `set_position(x, y, z, duration)` does the joint math for you. This module is about understanding what's happening underneath that call.",
      ),
      code(
        `#include "LobotSerialServoControl.h"

// BusServo.LobotSerialServoMove(id, pulse, duration_ms)
BusServo.LobotSerialServoMove(1, 500, 1000);  // servo ID1 (base) to pulse 500, over 1000ms
delay(1200);

// Read back what the servo is actually doing:
int position = BusServo.LobotSerialServoReadPosition(1);
int voltage  = BusServo.LobotSerialServoReadVin(1);
Serial.print("servo 1 position: "); Serial.println(position);
Serial.print("servo 1 voltage: ");  Serial.println(voltage);`,
        "cpp",
      ),
    ],
    aiContext:
      "Student is calling BusServo.LobotSerialServoMove(id, pulse, duration_ms) directly on individual arm joints (id 1/2/3), pulse ≈ 4.2×angle, range 0-1000. Also covers reading position/voltage back. Remind them: once they reach the Inverse Kinematics course, set_position(x,y,z,duration) replaces manually picking pulses per joint.",
  },
  {
    title: "Digital I/O Toolkit",
    contentBlocks: [
      text(
        "A grab-bag of small I/O building blocks you'll reuse constantly, even though none of them are arm-specific:\n\n" +
          "- **ADC / voltage sensing**: `analogRead(pin)` returns a raw 0-4095 reading; convert to volts with `voltage = (raw / 4095.0) * 3.2 / 0.25`.\n" +
          "- **Buttons**: read digitally with `digitalRead(pin)` — the onboard button pulls low when pressed. Always sample it 2-3 times with a short delay between reads (a debounce) rather than trusting a single read, or electrical noise will cause false triggers.\n" +
          "- **LEDs**: `digitalWrite(pin, HIGH)` / `digitalWrite(pin, LOW)`.\n" +
          "- **Timers**: the ESP32 has hardware timers for precise, non-blocking timing — useful once `delay()`-based sequencing starts feeling limiting.\n" +
          "- **Buzzer**: `setBuzzer(duration_ms)` — the short beep you'll hear constantly in every later challenge module, usually as a \"detected something\" confirmation.",
      ),
      code(
        `// Button (debounced read)
#define BUTTON_PIN 25
pinMode(BUTTON_PIN, INPUT_PULLUP);
int pressed = 0;
for (int i = 0; i < 3; i++) {
  pressed += (digitalRead(BUTTON_PIN) == LOW);
  delay(10);
}
if (pressed == 3) Serial.println("button pressed");

// LED blink
digitalWrite(2, HIGH); delay(500);
digitalWrite(2, LOW);  delay(500);

// Buzzer beep
setBuzzer(100); // beep for 100ms`,
        "cpp",
      ),
    ],
    aiContext:
      "Covers small non-arm-specific I/O: analogRead+voltage formula, debounced digitalRead for buttons, digitalWrite for LEDs, ESP32 hardware timers (concept only), setBuzzer(duration_ms). These get reused constantly in later sensor-game modules — if a student's sensor read is noisy/flickery, suggest a debounce loop like the one shown here.",
  },
  {
    title: "The Suction End Effector",
    contentBlocks: [
      text(
        "This is the module that clears up the most common misconception about MaxArm: **the end effector is a vacuum suction nozzle, not a mechanical claw or gripper.** There's no \"open\" and \"close\" — there's an air pump and a solenoid valve.\n\n" +
          "To pick something up: turn the pump on, which builds vacuum at the nozzle and holds the object. To release it: open the valve (which breaks the vacuum) and then close it again so the pump is ready for the next pickup.\n\n" +
          "If you ever see \"gripper\" or \"claw\" in competition materials, it almost always means this suction mechanism — there's no pinching or clamping motion on the stock MaxArm.",
      ),
      code(
        `#include "SuctionNozzle.h"

void setup() {
  Nozzle_init(); // initialize the pump/valve driver
}

void loop() {
  Pump_on();     // start suction — picks up the object
  delay(2000);
  Valve_on();    // open the valve — breaks vacuum, releases the object
  delay(500);
  Valve_off();   // close the valve, ready for the next pickup
  delay(2000);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "THE key correction module: MaxArm's end effector is a vacuum suction nozzle (Pump_on to grip, Valve_on then Valve_off to release), not a claw/gripper. If a student uses gripper/claw language or asks how to 'open' the gripper, correct them here specifically and explain the pump/valve sequence.",
  },
  {
    title: "Serial Communication Basics",
    contentBlocks: [
      text(
        "Before the arm can talk to a PC or a second board, it helps to understand raw serial (UART) communication on its own. The ESP32 has multiple hardware serial ports; this lesson uses a second one (beyond the USB debug console) to send and receive plain text between two boards, TX-to-RX and RX-to-TX crossed over.\n\n" +
          "This raw echo pattern is the foundation for the actual MaxArm command protocol covered in the next module — same idea, just plain text here instead of a binary frame format.",
      ),
      code(
        `HardwareSerial mySerial(1); // use UART port 1

void setup() {
  mySerial.begin(9600, SERIAL_8N1, /*rx=*/16, /*tx=*/17);
  Serial.begin(9600);
}

void loop() {
  if (mySerial.available()) {
    String msg = mySerial.readString();
    Serial.print("received: ");
    Serial.println(msg);
  }
  mySerial.write("ping\\n");
  delay(500);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Raw UART basics: HardwareSerial.begin(baud, mode, rx, tx), .available(), .read()/.readString(), .write(). This is groundwork for the Serial Protocol & PC Control module later in this course, which covers MaxArm's actual binary command format.",
  },
  {
    title: "Why Inverse Kinematics?",
    contentBlocks: [
      text(
        "Here's the problem: you don't think in servo angles, you think in positions — \"pick up the block that's 15cm in front of the arm.\" But the only thing you can directly command is 3 joint angles. Something has to convert between the two.\n\n" +
          "**Forward kinematics** answers \"if I know the 3 joint angles, where does the end effector end up?\" — straightforward geometry, just walk down the chain of links.\n\n" +
          "**Inverse kinematics** answers the harder, more useful question: \"if I want the end effector at this XYZ position, what 3 joint angles get me there?\" MaxArm's firmware solves this for you with a single function, `set_position(x, y, z, duration)` — you give it a position in millimeters, it works out and drives all 3 bus servos for you.\n\n" +
          "The next course, Inverse Kinematics, walks through exactly how that math works and how to use it for real movement, including tracing shapes in the air.",
      ),
    ],
    aiContext:
      "Conceptual bridge module: forward kinematics (angles → position) vs inverse kinematics (position → angles), and that set_position(x,y,z,duration) is the one function that hides this math from the student. No code here — sets up the Inverse Kinematics course.",
  },
  {
    title: "Serial Protocol & PC Control",
    contentBlocks: [
      text(
        "Everything so far has been code running on the arm's own ESP32. But MaxArm can also be driven live, in real time, from a separate computer (a PC, a Raspberry Pi, or another microcontroller) over the same serial connection — no need to re-flash the arm's firmware for every change.\n\n" +
          "The protocol is a simple binary frame:\n\n" +
          "`0xAA 0x55 [function] [data length] [data...] [checksum]`\n\n" +
          "Each function code maps to one capability: setting the 3 joint angles directly, setting an XYZ position (the PC-side equivalent of `set_position`), setting the PWM (nozzle-tilt) servo, or controlling the suction pump/valve — plus \"read\" versions of several of these to get live status back. The checksum is the bitwise complement of the sum of everything before it, so a receiver can catch corrupted frames.\n\n" +
          "This is exactly the mechanism behind any live/teleoperated control — a handheld controller, a custom PC app, or a Raspberry Pi script all just send frames in this format. Autonomous challenges (write code, upload it, let it run) and teleoperated challenges (stream live commands from a controller) are two different ways of using the same underlying arm.",
      ),
      code(
        `# Example: move to X=120mm, Y=-180mm, Z=85mm over 1000ms
# Frame: AA 55 | 03 (SET_XYZ) | 08 (data length) | x,y,z (int16 LE) + duration (uint16 LE) | checksum
frame = bytes([0xAA, 0x55, 0x03, 0x08,
               0x78, 0x00,   # x = 120
               0x4C, 0xFF,   # y = -180
               0x55, 0x00,   # z = 85
               0xE8, 0x03,   # duration = 1000ms
               0xF1])        # checksum
serial_port.write(frame)`,
        "python",
      ),
    ],
    aiContext:
      "Covers the 0xAA 0x55 [func][len][data][checksum] binary protocol used for external (PC/Raspberry Pi/second-MCU) live control of MaxArm, as an alternative to flashing autonomous code onto the arm's own ESP32. Function codes exist for joint angles, XYZ position, PWM servo, and suction control, plus read-back variants. This is the mechanism behind teleoperated/manual-controller challenges.",
  },
];

// ---------------------------------------------------------------------------
// 2. Inverse Kinematics (new course) — Section 3, 6 lessons, kept 1:1
// ---------------------------------------------------------------------------

const KINEMATICS_MODULES = [
  {
    title: "Establishing the Arm's Coordinate System",
    contentBlocks: [
      text(
        "Every position MaxArm moves to is described in a coordinate system with its origin at the base's center, in millimeters:\n\n" +
          "- **X**: positive = right, negative = left\n" +
          "- **Y**: positive = forward, negative = backward\n" +
          "- **Z**: **negative = up, positive = down** — this is inverted from what most people expect, and it's an easy source of bugs. Double-check your sign whenever a \"move up\" doesn't do what you expect.\n\n" +
          "The arm also can't reach everywhere: Z is capped around 255mm (down), and there's a roughly 50mm-radius dead zone directly above the base it can't physically reach into (√(x²+y²) must exceed it). If a move silently does nothing, check these limits before assuming your code is wrong.",
      ),
    ],
    aiContext:
      "Coordinate system: origin at base center, mm, X right+/left-, Y forward+/back-, Z INVERTED (negative=up, positive=down). Reach limits: z capped ~255mm, ~50mm dead-zone radius above the base. A very common bug source is the inverted Z sign or a target outside these limits.",
  },
  {
    title: "Forward Kinematics",
    contentBlocks: [
      text(
        "Forward kinematics answers: given the 3 joint angles, where is the end effector? You walk the chain of links: base rotation sets the direction you're facing, then the two arm-link angles (related by the law of cosines, since they form a triangle with the fixed link lengths) determine how far out and how high the end effector reaches.\n\n" +
          "MaxArm's firmware implements this as a `forward(joints[3], pos[3])` function using its known link lengths (`L0=84.4, L1=8.14, L2=128.4, L3=138.0, L4=16.8` mm). You won't call this directly very often — its main use is double-checking that a set of joint angles corresponds to the position you expect, or converting a servo status read-back into a real-world position.",
      ),
    ],
    aiContext:
      "Forward kinematics: joint angles → end-effector position, via the arm's link lengths (L0-L4) and the law of cosines. Implemented as forward(joints[3], pos[3]) in the firmware. Rarely called directly by students — inverse() is the one they'll actually use — but understanding it makes inverse kinematics make sense.",
  },
  {
    title: "Inverse Kinematics",
    contentBlocks: [
      text(
        "Inverse kinematics is the direction you'll actually use: given a target XYZ position, solve for the 3 joint angles that get the end effector there. MaxArm's firmware treats the arm as a 3-link system: a base-rotation angle (found with `atan(y/x)`) plus two arm-link angles solved geometrically with the law of cosines, since the two links and the target form a triangle of known side lengths.\n\n" +
          "You don't have to implement this math yourself — it's exactly what `set_position(x, y, z, duration)` does under the hood, every time you call it. This module is about understanding *why* that one function is doing real trigonometry, not about hand-rolling it yourself.",
      ),
    ],
    aiContext:
      "Inverse kinematics: target XYZ → 3 joint angles, via atan(y/x) for base rotation plus law-of-cosines geometry for the two arm-link angles. This is what set_position() computes internally on every call. Students should understand the concept, not re-derive the math by hand.",
  },
  {
    title: "Moving on X/Y/Z",
    contentBlocks: [
      text(
        "The one function that does all of this for you: `set_position(pos[3], duration_ms)`, where `pos = {x, y, z}` in millimeters. Give it a target and a duration, and it solves the inverse kinematics, converts the resulting angles to servo pulses, and drives all 3 bus servos to get there.\n\n" +
          "A practical note from the arm's home position: it starts right at the edge of its reachable space, so you often have to move down in Z *first* before X or Y moves will do anything — otherwise you're asking for a position outside the reachable envelope.",
      ),
      code(
        `#include "ESPMax.h"
#include "_espmax.h"

void setup() {
  ESPMax_init();
  go_home(2000); // move to the defined home position
}

void loop() {
  float pos[3];
  float x = 0, y = -(L1 + L3 + L4), z = (L0 + L2); // home position

  pos[0] = x; pos[1] = y; pos[2] = z - 100;
  set_position(pos, 2000); // move down 100mm from home first — required before X/Y moves work
  delay(2000);

  pos[0] = x - 50; pos[1] = y; pos[2] = z - 100;
  set_position(pos, 1000); // move 50mm left
  delay(1000);

  pos[0] = x; pos[1] = y - 50; pos[2] = z - 100;
  set_position(pos, 1000); // move 50mm back
  delay(1000);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "set_position(pos[3], duration_ms) is the core movement primitive — solves IK, converts to servo pulses, drives all 3 bus servos. Practical tip: from home position the arm is at the edge of its reachable envelope, so Z usually needs to move down before X/Y moves will succeed.",
  },
  {
    title: "Drawing a Cross",
    contentBlocks: [
      text(
        '"Drawing" a shape with the arm just means feeding `set_position()` a sequence of waypoints in order, fast enough and smoothly enough that the end effector traces a recognizable path through the air. A cross is the simplest version: move along a vertical line, lift slightly, reposition, then move along a horizontal line.\n\n' +
          "The interesting part is the horizontal stroke: instead of one long `set_position()` call, it's a tight loop of many small steps, each with a short duration — this is what makes the line look continuous rather than a robot arm jumping between two points.",
      ),
      code(
        `float pos[3];
// vertical stroke
pos[0] = 0; pos[1] = -120; pos[2] = 80;
set_position(pos, 1500); delay(1500);
pos[0] = 0; pos[1] = -280; pos[2] = 75;
set_position(pos, 1000); delay(1200);
pos[0] = 0; pos[1] = -280; pos[2] = 150; // lift
set_position(pos, 500); delay(800);

// reposition to the horizontal stroke's start
pos[0] = 100; pos[1] = -200; pos[2] = 150;
set_position(pos, 1000); delay(1200);
pos[0] = 100; pos[1] = -200; pos[2] = 80;
set_position(pos, 500); delay(600);

// horizontal stroke: many small steps = a smooth line, not a jump
for (int i = 100; i > -100; i -= 2) {
  pos[0] = i; pos[1] = -200; pos[2] = 80;
  set_position(pos, 5);
  delay(5);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "'Drawing' = a sequence of set_position() waypoints. Key technique: a tight loop of small-step, short-duration calls produces a smooth continuous line instead of jumps between distant points. This cross is 2 strokes: one big multi-point vertical move, one fine-grained looped horizontal sweep.",
  },
  {
    title: "Drawing a Square",
    contentBlocks: [
      text(
        "Same technique as the cross, scaled up to 4 sides: each edge of the square is a `for` loop sweeping one coordinate in small steps while holding (or gradually adjusting) the others, so all 4 strokes connect into a continuous outline instead of 4 disconnected lines.\n\n" +
          "Notice the two vertical edges also nudge Z slightly as they sweep — a small correction to keep the pen (or suction nozzle) at a consistent \"drawing height\" as the arm's geometry changes across the reachable envelope.",
      ),
      code(
        `float pos[3];
pos[0] = 50; pos[1] = -260; pos[2] = 80;
set_position(pos, 2000); delay(3000); // move to the starting corner

// top edge
for (int i = 50; i > -50; i -= 5) {
  pos[0] = i; pos[1] = -260; pos[2] = 80;
  set_position(pos, 30); delay(30);
}
delay(500);

// right edge (note the small Z correction as Y sweeps)
for (int i = -260; i < -160; i += 5) {
  pos[0] = -50; pos[1] = i; pos[2] = 80 - (26 + i / 10);
  set_position(pos, 30); delay(30);
}
delay(500);

// bottom edge
for (int i = -50; i < 50; i += 5) {
  pos[0] = i; pos[1] = -160; pos[2] = 70;
  set_position(pos, 30); delay(30);
}
delay(500);

// left edge
for (int i = -160; i > -260; i -= 5) {
  pos[0] = 50; pos[1] = i; pos[2] = 80 - (26 + i / 10);
  set_position(pos, 30); delay(30);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Square = 4 for-loops, one per edge, each sweeping one coordinate in small steps so the 4 strokes connect into a continuous outline. The two Z-sweeping edges include a small height correction term — worth pointing out if a student is confused why Z isn't constant on those edges.",
  },
];

// ---------------------------------------------------------------------------
// 3. Robotic Arm Academy — REPLACE existing modules with the 10 real
//    Section 2 "Sensor-extension Game" lessons
// ---------------------------------------------------------------------------

const ACADEMY_MODULES = [
  {
    title: "Ultrasonic Detection + Digital Display",
    contentBlocks: [
      text(
        "Your first sensor-driven module: read live distance from the ultrasonic sensor and show it on a 7-segment digital display, while also color-cueing an RGB indicator on the sensor itself by distance range (near/medium/far). No arm movement yet — this is purely about getting comfortable reading a sensor continuously and reacting to it in real time.",
      ),
      code(
        `#include "ESPMax.h"
#include "TM1640.h"
#include "Ultrasound.h"

TM1640 module(32, 33); // digital display driver
Ultrasound ultrasound;

void setup() {
  ESPMax_init();
  go_home(2000);
  Serial.begin(115200);
}

void loop() {
  char text[6];
  int distance = ultrasound.GetDistance(); // read distance in mm
  sprintf(text, "%4d", distance);
  module.setDisplayToString(text); // show it on the digital display

  if (distance > 0 && distance <= 50) ultrasound.Color(0, 255, 0, 0, 255, 0);       // near: green
  else if (distance <= 100)           ultrasound.Color(255, 0, 0, 255, 0, 0);       // medium: red
  else                                 ultrasound.Color(0, 0, 255, 0, 0, 255);       // far: blue
  delay(300);
}`,
        "cpp",
      ),
    ],
    aiContext:
      "First sensor module: continuous ultrasonic reads (ultrasound.GetDistance()) driving a digital display + RGB color cue by distance range. No arm movement — the point is getting comfortable with sensor read loops before combining with movement in the next module.",
  },
  {
    title: "Ultrasonic Detection + Suction Pickup",
    contentBlocks: [
      text(
        "The first full pick-and-place: wait until an object enters a specific distance range (averaged over several readings to avoid a false trigger), then run a fixed sequence — descend, turn on suction, lift, move to the drop zone, tilt the nozzle to compensate for orientation, release, and return home.\n\n" +
          "Every later Academy module is a variation on this same shape: **sense → confirm → move to pickup → suck → move to drop-off → release → reset.**",
      ),
      code(
        `#include "ESPMax.h"
#include "Ultrasound.h"
#include "SuctionNozzle.h"
#include "ESP32PWMServo.h"

Ultrasound ultrasound;

void setup() {
  ESPMax_init(); Nozzle_init(); PWMServo_init();
  go_home(2000);
  SetPWMServo(1, 1500, 1000); // nozzle to neutral tilt
}

void loop() {
  int distance = 0;
  for (int i = 0; i < 5; i++) { distance += ultrasound.GetDistance(); delay(200); }
  distance /= 5; // average several reads to avoid a false trigger

  if (distance > 60 && distance < 80) {
    float pos[3];
    pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos, 1500); delay(1500); // above the block
    pos[0]=0; pos[1]=-160; pos[2]=85;  set_position(pos, 800);  // down onto it
    Pump_on(); delay(1000);                                     // grip
    pos[0]=0; pos[1]=-160; pos[2]=200; set_position(pos, 1000); delay(1000); // lift
    pos[0]=70; pos[1]=-150; pos[2]=200; set_position(pos, 800);  delay(800); // above drop zone
    SetPWMServo(1, 2200, 500); delay(200);                      // tilt to square the block
    pos[0]=70; pos[1]=-150; pos[2]=90; set_position(pos, 800);  delay(800); // down to drop zone
    Valve_on();                                                 // release
    pos[0]=70; pos[1]=-150; pos[2]=200; set_position(pos, 1000); delay(1000); // lift
    Valve_off();
    go_home(1500); delay(200);
    SetPWMServo(1, 1500, 500); delay(1500);                     // nozzle back to neutral
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "The core pick-and-place pattern every later module reuses: average several ultrasonic reads, gate on a distance range, then sense→pickup→lift→move→drop→release→home. Pump_on()=grip, Valve_on()/Valve_off()=release. If a student's arm 'grabs air', check their distance threshold and averaging first.",
  },
  {
    title: "Ultrasonic Detection + Stacking",
    contentBlocks: [
      text(
        "Same trigger as the previous module, but now placing multiple objects into a growing stack: an `overlay` counter tracks how many blocks have been placed, and each placement's Z height increases by a fixed amount (40mm per block) so each new block lands on top of the last, wrapping back to the bottom every 3 blocks.\n\n" +
          "This lesson also ships a genuine MicroPython version alongside the Arduino one — same logic, different language, proof that MaxArm's high-level API (`set_position`, `nozzle.on()/off()`, `go_home()`) is consistent across both.",
      ),
      code(
        `int overlay = 0;
void loop() {
  int distance = 0;
  for (int i = 0; i < 5; i++) { distance += ultrasound.GetDistance(); delay(200); }
  distance /= 5;

  if (distance > 60 && distance < 80) {
    float pos[3];
    pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos,1500); delay(1500);
    pos[0]=0; pos[1]=-160; pos[2]=85;  set_position(pos,800);
    Pump_on(); delay(1000);
    pos[0]=0; pos[1]=-160; pos[2]=200; set_position(pos,1000); delay(1000);
    pos[0]=160; pos[1]=0; pos[2]=200;  set_position(pos,1500); delay(1500); // stack location
    pos[0]=160; pos[1]=0; pos[2]=90 + overlay*40; set_position(pos,1000); delay(1000); // stack height grows
    Valve_on();
    pos[0]=160; pos[1]=0; pos[2]=200; set_position(pos,1000); delay(1000);
    Valve_off();
    go_home(1500); delay(1500);
    overlay += 1;
    if (overlay >= 3) overlay = 0; // reset after 3 blocks
  }
}`,
        "cpp",
      ),
      code(
        `from espmax import ESPMax
from BusServo import BusServo
from SuctionNozzle import SuctionNozzle
# same idea in MicroPython — the high-level API matches the Arduino version:
arm = ESPMax(BusServo())
nozzle = SuctionNozzle()

arm.go_home()
overlay = 0
while True:
    distance = hwsr06.getDistance()
    if 70 < distance < 80:
        arm.set_position((0, -160, 85), 1500)   # pick up
        nozzle.on()
        arm.set_position((160, 0, 200), 1500)   # above the stack
        arm.set_position((160, 0, 88 + overlay * 40), 1000)  # stack height grows
        nozzle.off()
        arm.go_home()
        overlay = (overlay + 1) % 3`,
        "python",
      ),
    ],
    aiContext:
      "Stacking: same sense→pickup→drop pattern, but a counter (overlay) increases the drop Z by a fixed step per block, wrapping every 3. Ships in both Arduino C++ and MicroPython with a matching high-level API (set_position/arm.set_position, Pump_on/nozzle.on) — good module to point to if a student asks whether Python is really supported.",
  },
  {
    title: "Touch Detection + Placement",
    contentBlocks: [
      text(
        "Swaps the trigger from a distance sensor to a touch sensor (a simple digital pin that goes low when pressed) and adds precision placement: each of up to 3 blocks gets placed at a different Y offset (spread out in a row) and a different nozzle-tilt compensation angle, tracked by a counter that cycles every 3 blocks with a double-beep confirmation.",
      ),
      code(
        `#define SENSOR_PIN 23
int num = 0;
int tilt_angles[3] = {1800, 2000, 2200}; // per-slot nozzle tilt compensation

void loop() {
  float sensor_state = 0;
  for (int i = 0; i < 3; i++) { sensor_state += digitalRead(SENSOR_PIN); delay(20); }

  if (sensor_state == 0) { // touch sensor pulls the pin low when pressed
    float pos[3];
    pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos,1500); delay(1500);
    pos[0]=0; pos[1]=-160; pos[2]=85;  set_position(pos,800);
    Pump_on(); delay(1000);
    pos[0]=0; pos[1]=-160; pos[2]=180; set_position(pos,1000); delay(1000);
    pos[0]=120; pos[1]=(-20 - 60*num); pos[2]=180; set_position(pos,1500); // spread across a row
    SetPWMServo(1, tilt_angles[num], 1000); delay(500);                   // per-slot compensation
    pos[0]=120; pos[1]=(-20 - 60*num); pos[2]=(83+num); set_position(pos,1000); delay(1200);
    Valve_on();
    pos[0]=120; pos[1]=(-20 - 60*num); pos[2]=200; set_position(pos,1000); delay(1000);
    Valve_off();
    go_home(1500);
    SetPWMServo(1, 1500, 1500);
    num += 1;
    if (num >= 3) { num = 0; setBuzzer(100); delay(100); setBuzzer(100); } // double-beep, cycle reset
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Touch-triggered precision placement: digitalRead low = pressed. Introduces per-slot placement (Y offset by num, indexed tilt-compensation array) and a cycling counter with a double-beep every 3rd block. This is a direct rehearsal for precision-scoring competition challenges.",
  },
  {
    title: "Infrared Detection + Control",
    contentBlocks: [
      text(
        "Structurally identical to the ultrasonic pickup module, but the trigger is now an infrared proximity sensor instead of ultrasonic distance — same debounced multi-read pattern, same pickup/drop sequence, different sensor. Good practice for recognizing that most of these sensor lessons are really about swapping one input for another around the same movement skeleton.",
      ),
      code(
        `#define SENSOR_PIN 23 // infrared sensor
void loop() {
  float sensor_state = 0;
  for (int i = 0; i < 5; i++) { sensor_state += digitalRead(SENSOR_PIN); delay(50); }

  if (sensor_state == 0) { // infrared sensor pulls the pin low when it detects a target
    float pos[3];
    pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos,1500); delay(1500);
    pos[0]=0; pos[1]=-160; pos[2]=85;  set_position(pos,800);
    Pump_on(); delay(1000);
    pos[0]=0; pos[1]=-160; pos[2]=200; set_position(pos,1000); delay(1000);
    pos[0]=70; pos[1]=-150; pos[2]=200; set_position(pos,800); delay(800);
    SetPWMServo(1, 2200, 500); delay(200);
    pos[0]=70; pos[1]=-150; pos[2]=90; set_position(pos,800); delay(800);
    Valve_on();
    pos[0]=70; pos[1]=-150; pos[2]=200; set_position(pos,1000); delay(1000);
    Valve_off();
    go_home(1500);
    SetPWMServo(1, 1500, 500); delay(1500);
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Infrared version of the ultrasonic-pickup pattern — same skeleton, swapped sensor. Good module to reinforce that most sensor-game lessons are 'same movement skeleton, different sensor trigger' rather than genuinely new logic each time.",
  },
  {
    title: "Dual Infrared Detection + Sorting",
    contentBlocks: [
      text(
        "Two infrared sensors (left and right) instead of one, each routing its detected object to a different drop location — the first real sorting logic in the Academy, and a direct preview of the color-sorting module next.",
      ),
      code(
        `#define IR_LEFT  23
#define IR_RIGHT 32

void loop() {
  float left = 0, right = 0;
  for (int i = 0; i < 5; i++) { left += digitalRead(IR_LEFT); right += digitalRead(IR_RIGHT); delay(50); }

  if (left == 0) {
    // pick up from the left sensor's position, drop at zone A
    float pos[3];
    pos[0]=70; pos[1]=-165; pos[2]=120; set_position(pos,1500); delay(1500);
    pos[0]=70; pos[1]=-165; pos[2]=86;  set_position(pos,800);
    Pump_on(); delay(1000);
    pos[0]=150; pos[1]=-35; pos[2]=200; set_position(pos,800); delay(800);
    pos[0]=150; pos[1]=10;  pos[2]=90;  set_position(pos,800); delay(800);
    Valve_on();
    go_home(1500);
  } else if (right == 0) {
    // pick up from the right sensor's position, drop at zone B (mirrored X)
    float pos[3];
    pos[0]=-70; pos[1]=-165; pos[2]=120; set_position(pos,1500); delay(1500);
    pos[0]=-70; pos[1]=-165; pos[2]=86;  set_position(pos,800);
    Pump_on(); delay(1000);
    pos[0]=-150; pos[1]=-35; pos[2]=200; set_position(pos,800); delay(800);
    pos[0]=-150; pos[1]=10;  pos[2]=90;  set_position(pos,800); delay(800);
    Valve_on();
    go_home(1500);
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "First real sorting logic: 2 IR sensors, each with its own pickup position and drop zone (mirrored X coordinates). If-else branching by which sensor triggered. Direct conceptual preview of color sorting in the next module.",
  },
  {
    title: "Color Recognition",
    contentBlocks: [
      text(
        "Uses an APDS-9960 color sensor to read raw red/green/blue light levels, scales each channel into a 0-255 range (the raw sensor values and useful ranges vary by lighting, so this scaling is calibrated per-channel), and picks whichever channel reads highest as the detected color — with a couple of tie-break rules for the red/green/blue boundary cases. Averages 5 reads before trusting a result, same as every sensor lesson so far.\n\n" +
          "This module only detects and reports color (via serial print + an RGB indicator light) — no arm movement yet. That comes next.",
      ),
      code(
        `#include "Arduino_APDS9960.h"

#define RED 1
#define GREEN 2
#define BLUE 3

int ColorDetect() {
  while (!APDS.colorAvailable()) delay(5);
  int r, g, b;
  APDS.readColor(r, g, b);
  r = map(r, 30, 3000, 0, 255);   // per-channel calibration ranges
  g = map(g, 50, 2600, 0, 255);
  b = map(b, 50, 3500, 0, 255);

  int c = (r > g) ? RED : GREEN;
  if (c == GREEN && g < b) c = BLUE;
  if (c == RED && r < b) c = BLUE;

  if (c == BLUE && b > 60) return c;
  if (c == GREEN && g > 60) return c;
  if (c == RED && r > 60) return c;
  return 0; // no confident read
}

void loop() {
  if (ColorDetect()) {
    float sum = 0;
    for (int i = 0; i < 5; i++) { sum += ColorDetect(); delay(80); } // average multiple reads
    int result = sum / 5.0; // non-integer average means the reading was unstable
    if (result == RED) Serial.println("Red");
    else if (result == GREEN) Serial.println("Green");
    else if (result == BLUE) Serial.println("Blue");
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Color detection with an APDS-9960 sensor: read raw RGB, map() each channel to 0-255 with per-channel calibration constants, pick the max channel with tie-break rules, average 5 reads (non-integer average = unstable reading, discard). Detection only, no movement — that's the next module (Color Sorting).",
  },
  {
    title: "Color Sorting",
    contentBlocks: [
      text(
        "Combines color recognition with the ultrasonic-triggered pickup pattern into a proper two-phase state machine: first detect and lock in a color (with its own dedicated drop zone and nozzle-tilt compensation), then wait for the ultrasonic sensor to confirm the object is in pickup range before actually running the pick-and-place sequence. An RGB indicator on the ultrasonic module lights up to match the detected color as feedback.\n\n" +
          "This is the closest Academy module to a real competition challenge — it's essentially a from-scratch build of something like \"Stack Em' Up\": detect color, then sort into matching zones.",
      ),
      code(
        `bool color_detect = true;
int detect_color = 0, x, y, z, angle_pul;

void loop() {
  if (color_detect) {                 // phase 1: figure out the color
    if (ColorDetect()) {
      float avg = 0;
      for (int i = 0; i < 5; i++) { avg += ColorDetect(); delay(80); }
      color_detect = false;
      if (avg == 1.0) { x=120; y=-140; z=85; angle_pul=2200; detect_color=RED;   ultrasound.Color(255,0,0,255,0,0); }
      else if (avg == 2.0) { x=120; y=-80; z=85; angle_pul=2000; detect_color=GREEN; ultrasound.Color(0,255,0,0,255,0); }
      else if (avg == 3.0) { x=120; y=-20; z=82; angle_pul=1800; detect_color=BLUE;  ultrasound.Color(0,0,255,0,0,255); }
      else { detect_color = 0; color_detect = true; } // unstable read, stay in phase 1
    }
  } else {                            // phase 2: wait for the object to be in pickup range
    int distance = 0;
    for (int i = 0; i < 5; i++) { distance += ultrasound.GetDistance(); delay(100); }
    distance /= 5;
    if (distance > 60 && distance < 80 && detect_color) {
      float pos[3];
      pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos,1500); delay(1500);
      pos[0]=0; pos[1]=-160; pos[2]=85;  set_position(pos,800);
      Pump_on(); delay(1000);
      pos[0]=0; pos[1]=-160; pos[2]=180; set_position(pos,1000); delay(1000);
      pos[0]=x; pos[1]=y; pos[2]=180; set_position(pos,1500); delay(1500);
      SetPWMServo(1, angle_pul, 800); delay(200);
      pos[0]=x; pos[1]=y; pos[2]=z; set_position(pos,1000); delay(1000);
      Valve_on();
      pos[0]=x; pos[1]=y; pos[2]=200; set_position(pos,1000); delay(1000);
      Valve_off();
      go_home(1500);
      SetPWMServo(1, 1500, 800);
      detect_color = 0; color_detect = true; // back to phase 1 for the next object
    }
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Two-phase state machine: color_detect flag toggles between 'figure out the color and remember its drop zone' and 'wait for pickup range, then execute'. Maps directly to competition-style color-sorting challenges. If a student's sort mixes up colors, check that phase 1 actually latches detect_color before phase 2 runs.",
  },
  {
    title: "Sound Detection + Placement",
    contentBlocks: [
      text(
        "Triggers off a sound sensor instead of a proximity/color sensor — counts sound spikes (like claps) within a rolling time window to decide how many blocks to place in this round (up to 3), then runs the same row-placement pattern as the touch-detection module, with per-slot tilt compensation.",
      ),
      code(
        `#define SOUND_PIN 32
int tilt_angles[3] = {1800, 2000, 2200};

void loop() {
  int num = 0;
  bool triggered = false;
  long windowStart = millis();

  while (true) {
    float soundValue = analogRead(SOUND_PIN);
    if (soundValue > 50 && (num == 0 || millis() - windowStart < 1000)) {
      windowStart = millis();
      num += 1;
      delay(80);
    }
    if (num > 0 && millis() - windowStart > 1500) {
      if (num > 3) num = 3;
      triggered = true;
    }
    if (triggered) {
      float pos[3];
      pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos,1500); delay(1500);
      pos[0]=0; pos[1]=-160; pos[2]=86;  set_position(pos,800);
      Pump_on(); delay(1000);
      pos[0]=0; pos[1]=-160; pos[2]=180; set_position(pos,1000); delay(1000);
      pos[0]=120; pos[1]=(-20 - 60*(num-1)); pos[2]=180; set_position(pos,1500);
      SetPWMServo(1, tilt_angles[num-1], 1000); delay(500);
      pos[0]=120; pos[1]=(-20 - 60*(num-1)); pos[2]=88; set_position(pos,1000); delay(1200);
      Valve_on();
      pos[0]=120; pos[1]=(-20 - 60*(num-1)); pos[2]=200; set_position(pos,1000); delay(1000);
      Valve_off();
      go_home(1500);
      SetPWMServo(1, 1500, 1500);
      break; // start a fresh counting window next loop
    }
    delay(20);
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Sound-triggered placement: analogRead on a sound sensor, counting spikes within a rolling ~1-1.5s window (up to 3), then the same row-placement pattern with per-slot tilt compensation seen in the touch-detection module. Debugging tip: the '50' threshold and window timings are the first things to tune if triggering feels too sensitive/insensitive.",
  },
  {
    title: "Light Detection + Placement",
    contentBlocks: [
      text(
        "Uses a photoresistor-style light sensor instead of sound: a rising analog reading means something is blocking the light (the sensor value goes up as light decreases), which triggers the same row-placement sequence, cycling through 3 slots with a double-beep on completing a full cycle — mirroring the touch-detection module almost exactly, but analog instead of digital.",
      ),
      code(
        `#define LIGHT_PIN 32
int num = 0;
int tilt_angles[3] = {1600, 1800, 2000};

void loop() {
  float lightValue = analogRead(LIGHT_PIN); // higher value = less light (something is blocking it)

  if (lightValue > 950) {
    float pos[3];
    pos[0]=0; pos[1]=-160; pos[2]=100; set_position(pos,1500); delay(1500);
    pos[0]=0; pos[1]=-160; pos[2]=86;  set_position(pos,800);
    Pump_on(); delay(1000);
    pos[0]=0; pos[1]=-160; pos[2]=180; set_position(pos,1000); delay(1000);
    pos[0]=120; pos[1]=(-20 - 60*num); pos[2]=180; set_position(pos,1500);
    SetPWMServo(1, tilt_angles[num], 1000); delay(500);
    pos[0]=120; pos[1]=(-20 - 60*num); pos[2]=88; set_position(pos,1000); delay(1200);
    Valve_on();
    pos[0]=120; pos[1]=(-20 - 60*num); pos[2]=200; set_position(pos,1000); delay(1000);
    Valve_off();
    go_home(1500);
    SetPWMServo(1, 1500, 1500);
    num += 1;
    if (num >= 3) { num = 0; setBuzzer(100); delay(100); setBuzzer(100); }
  } else {
    delay(300);
  }
}`,
        "cpp",
      ),
    ],
    aiContext:
      "Light-triggered placement, analog version of the touch-detection module: analogRead rising = light blocked (photoresistor reads higher with less light). Same 3-slot cycling with tilt compensation and double-beep reset. Good module to contrast digitalRead-based vs analogRead-based triggers.",
  },
];

// ---------------------------------------------------------------------------
// 4. Robot Arm Coding Competition — patch the 3 challenge modules in place
//    (suction, not gripper; note the claw/suction terminology mismatch)
// ---------------------------------------------------------------------------

const CHALLENGE_PATCHES = {
  "Challenge: Stack Em' Up": [
    text(
      "Nine cube blocks (3 red, 3 green, 3 blue) arrive in a fixed, scrambled sequence. Using the Ultrasonic sensor to detect each block's arrival and the Color sensor to identify it, sort every block into its matching color stack.\n\n" +
        "Skills tested: conditionals, color sorting, sensor sequencing — this is exactly what the Academy's \"Color Sorting\" module trains for. Mechanically, picking up a block means turning on the suction pump (`Pump_on()`); releasing it means opening then closing the valve (`Valve_on()` then `Valve_off()`) — not an open/close gripper motion.\n\n" +
        "Scoring emphasizes correct sorting (Objective) and finishing at or faster than the competitor average (Time), on top of Code Quality and Presentation.",
    ),
  ],
  "Challenge: Bridgerton Bridge": [
    text(
      "Build a two-arch drawbridge from 8 slab blocks and 2 arch blocks, using the Ultrasonic sensor. Build order matters — both arches must be placed before any roadway slab, or the structure (and your Objective score) won't hold up.\n\n" +
        "Skills tested: construction sequencing, spatial precision, planning multi-step builds — this extends the Academy's sensor-triggered pick-and-place pattern to placing several distinct pieces (`Pump_on()` to pick up each slab/arch, `Valve_on()`/`Valve_off()` to place it) in a specific order rather than a repeated loop.",
    ),
  ],
  "Challenge: Operation (Robot-Assisted Surgery)": [
    text(
      "Using the handheld Multi-Platform Controller — manual control, not autonomous code — extract three \"organ\" blocks from among surrounding obstacle blocks without knocking any of them over.\n\n" +
        "This is the one challenge that's about hands, not code: steady, deliberate control under time pressure. It's a direct payoff of the Academy's \"Touch Detection + Placement\" module's precision focus, and of the live serial-control mechanism covered in the Fundamentals course's \"Serial Protocol & PC Control\" module — the same `SET_XYZ`/`SET_SUCTIONNOZZLE` command types drive the arm live from the controller instead of from uploaded code.\n\n" +
        "Each obstacle you disturb costs Objective points, so slow and careful beats fast and sloppy here.\n\n" +
        "Note: some official RACC materials describe this kind of challenge using \"claw\"/\"clamp\" language. The stock MaxArm kit's end effector is a vacuum suction nozzle, not a mechanical claw — if your chapter's kit has a different attachment, adjust accordingly, but the platform's own reference material (and the AI tutor) assumes suction unless told otherwise.",
    ),
  ],
};

async function patchChallengeModules(courseTitle, patches) {
  const courseSnap = await db.collection("courses").where("title", "==", courseTitle).limit(1).get();
  if (courseSnap.empty) {
    console.log(`"${courseTitle}" not found — skipping challenge patch`);
    return;
  }
  const courseId = courseSnap.docs[0].id;
  const modulesSnap = await db.collection("modules").where("courseId", "==", courseId).get();
  let patched = 0;
  for (const doc of modulesSnap.docs) {
    const title = doc.data().title;
    if (patches[title]) {
      await doc.ref.update({ contentBlocks: patches[title] });
      patched += 1;
    }
  }
  console.log(`patched ${patched}/${Object.keys(patches).length} challenge modules in "${courseTitle}"`);
}

async function replaceAcademyModules(courseTitle, newModules) {
  const courseSnap = await db.collection("courses").where("title", "==", courseTitle).limit(1).get();
  if (courseSnap.empty) {
    console.log(`"${courseTitle}" not found — skipping Academy rewrite`);
    return;
  }
  const courseRef = courseSnap.docs[0].ref;
  const course = courseSnap.docs[0].data();

  if (course.moduleIds.length === newModules.length) {
    console.log(`"${courseTitle}" already has ${newModules.length} modules — assuming already rewritten, skipping`);
    return;
  }

  for (const moduleId of course.moduleIds) {
    await deleteModuleCascade(moduleId);
  }

  const moduleIds = [];
  for (const [i, m] of newModules.entries()) {
    const ref = await db.collection("modules").add({
      courseId: courseRef.id,
      title: m.title,
      order: i + 1,
      type: "content",
      contentBlocks: m.contentBlocks,
      aiContext: m.aiContext,
    });
    moduleIds.push(ref.id);
  }
  await courseRef.update({ moduleIds });
  console.log(`rewrote "${courseTitle}" with ${moduleIds.length} real modules (was ${course.moduleIds.length})`);
}

// ---------------------------------------------------------------------------

await createCourseWithModules(
  "MaxArm Fundamentals",
  "The hardware and firmware basics every RACC competitor needs: servos, sensors, the suction end effector, and how the arm talks to a controlling computer.",
  1,
  FUNDAMENTALS_MODULES,
);

await createCourseWithModules(
  "Inverse Kinematics",
  "How MaxArm turns an XYZ position into 3 joint angles — the math behind every set_position() call, and how to use it to trace real paths.",
  2,
  KINEMATICS_MODULES,
);

await replaceAcademyModules("Robotic Arm Academy", ACADEMY_MODULES);
await patchChallengeModules("Robot Arm Coding Competition", CHALLENGE_PATCHES);

console.log("done");
