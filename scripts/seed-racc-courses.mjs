// Seeds the two top-level courses for the platform: the "Robotic Arm Academy"
// prep ladder and the "Robot Arm Coding Competition" reference course. Skips
// any course whose title already exists, so it's safe to re-run.
// Usage: node --env-file=.env.local scripts/seed-racc-courses.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "null");
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
  process.exit(1);
}

initializeApp({ credential: cert(key) });
const db = getFirestore();

function textBlock(content) {
  return { type: "text", content };
}

const COURSES = [
  {
    title: "Robotic Arm Academy",
    description:
      "A five-part skill ladder that prepares chapter nominees for the Robotic Arm Coding Competition — from wiring your first sensor to full autonomous and teleoperated control.",
    order: 1,
    modules: [
      {
        title: "Wiring & Setup",
        type: "content",
        contentBlocks: [
          textBlock(
            "Before you can write a line of competition code, get comfortable with the hardware you'll be using: the Hiwonder MaxArm, an open-source 6-DOF robot arm powered by an ESP32 microcontroller.\n\n" +
              "In this module you will:\n" +
              "- Physically mount and power the arm on the challenge grid mat\n" +
              "- Wire the Ultrasonic, Color, Sound, and Touch sensors to the correct ESP32 pins\n" +
              "- Install your toolchain of choice — the Arduino IDE (C++) or a MicroPython/Python workflow — and get a \"hello arm\" movement running\n" +
              "- Confirm each sensor returns a live reading in your serial monitor\n\n" +
              "This is the foundation every later module builds on — a miswired sensor here is the #1 cause of stuck teams at competition.",
          ),
        ],
        aiContext:
          "Student is setting up MaxArm hardware and the ESP32 toolchain (Arduino/C++ or Python/MicroPython) for the first time. Help debug wiring pin mismatches, missing board drivers/libraries, and serial monitor connection issues. Don't write their sensor code for them — point them to the specific pin or library method to check.",
      },
      {
        title: "Sensor-Triggered Builds",
        type: "content",
        contentBlocks: [
          textBlock(
            "Every RACC challenge starts the same way: your program has to notice something in the real world before it acts. This module is about the simplest version of that loop.\n\n" +
              "You'll practice:\n" +
              "- Reading a single sensor (start with Ultrasonic) in a loop\n" +
              "- Triggering an arm movement only when a condition is met (e.g., an object is within range)\n" +
              "- Commanding a basic pick-and-place: move to a position, close the gripper, move to a target, release\n\n" +
              "Goal: reliably pick up one block and place it in a marked zone, triggered by a sensor reading — no hardcoded timers.",
          ),
        ],
        aiContext:
          "Student is writing their first sensor-conditional pick-and-place loop. Common issues: polling too fast/slow, off-by-one gripper timing, not resetting state between triggers. Nudge toward reading sensor docs and testing in small isolated steps rather than debugging the whole loop at once.",
      },
      {
        title: "Color & Ultrasonic Sorting",
        type: "content",
        contentBlocks: [
          textBlock(
            "Now combine two senses. This is the skill behind challenges like \"Stack Em' Up\" — detecting that a block has arrived, then reading its color to decide where it goes.\n\n" +
              "You'll practice:\n" +
              "- Sequencing an Ultrasonic \"presence\" check before a Color read (color sensors are unreliable on a moving target)\n" +
              "- Branching your pick-and-place logic by color (red / green / blue)\n" +
              "- Building distinct stacks or zones per color without cross-contaminating them\n\n" +
              "Goal: given a scrambled sequence of colored blocks arriving one at a time, sort each into its correct color pile.",
          ),
        ],
        aiContext:
          "Student is combining ultrasonic presence-detection with color-based branching logic to sort blocks. Common issues: reading color before the block is fully in position, conditionals that don't handle all 3 colors, stacks drifting/misaligning after a few blocks. Encourage clean if/else or switch structure over nested conditionals.",
      },
      {
        title: "Precision: The Claw Machine",
        type: "content",
        contentBlocks: [
          textBlock(
            "Precision is worth more points than speed in every RACC rubric. This module is about surgical accuracy: using the Touch sensor to confirm contact before you commit to a grip, and extracting one object from a cluster without disturbing its neighbors.\n\n" +
              "You'll practice:\n" +
              "- Using the Touch sensor to detect contact/resistance instead of assuming a fixed position\n" +
              "- Fine-grained joint control for approach angles that avoid nearby obstacles\n" +
              "- Extracting a target block from inside/among other blocks without knocking anything over\n\n" +
              "Goal: remove a single \"organ\" block from a cluster of obstacle blocks, zero obstacles disturbed — this is a direct rehearsal for the \"Operation\" challenge.",
          ),
        ],
        aiContext:
          "Student is practicing precision extraction using the touch sensor, foreshadowing the Operation-style challenge. Common issues: approach angle too steep and clips neighboring blocks, gripper closing before full contact confirmed, not slowing down near the target. Push them to test approach vectors incrementally rather than one big motion.",
      },
      {
        title: "Full Sequence & Manual Control",
        type: "content",
        contentBlocks: [
          textBlock(
            "The final rung: combine everything, and add the one skill that's purely physical — operating the arm by hand with the Multi-Platform Controller.\n\n" +
              "You'll practice:\n" +
              "- Running a full autonomous sequence: detect, sort, and stack multiple blocks end-to-end without stopping\n" +
              "- Switching to manual/teleoperation mode with the Multi-Platform Controller for tasks that need a human's judgment\n" +
              "- Managing your time across both modes, since competition challenges are timed\n\n" +
              "Completing this module — recorded on video and reviewed by your chapter lead — is what qualifies you to be your chapter's nominee for the Robotic Arm Coding Competition.",
          ),
        ],
        aiContext:
          "Student is combining full autonomous sequencing with manual teleoperation via the Multi-Platform Controller, the final qualification milestone. Help them debug state transitions between autonomous and manual modes, and remind them this task is chapter-lead-verified — encourage them to record cleanly and narrate what their code is doing.",
      },
    ],
  },
  {
    title: "Robot Arm Coding Competition",
    description:
      "What BDPA's official Robotic Arm Coding Competition (RACC) is, how to qualify, and a breakdown of this year's challenges and judging.",
    order: 2,
    modules: [
      {
        title: "What is RACC?",
        type: "content",
        contentBlocks: [
          textBlock(
            "The Robotic Arm Coding Competition (RACC) is BDPA's flagship robotics event, sponsored by Johnson & Johnson, held each year at the BDPA National Conference. Each participating chapter sends one nominee (plus a backup) to compete solo.\n\n" +
              "Hardware: the Hiwonder MaxArm, an open-source, ESP32-powered robot arm with built-in inverse kinematics, equipped with Ultrasonic, Color, Sound, and Touch sensors plus a handheld Multi-Platform Controller for manual tasks.\n\n" +
              "Software: competitors write in Arduino/C++ or Python/MicroPython. A sanctioned AI coding assistant is available during the competition — used well, it's a helper for syntax and debugging; used to generate whole solutions, it costs you Code Quality points (see the Judging module).\n\n" +
              "RACC has grown every year — from simple physical block challenges in 2023 to today's precise, sensor-driven coding challenges with a real hardware/software stack. The Robotic Arm Academy course exists to get you ready for it.",
          ),
        ],
        aiContext:
          "General orientation module explaining what RACC is. Student questions here are usually logistics/overview, not code — point toward the Eligibility or Judging modules for specifics, or the Robotic Arm Academy course to start training.",
      },
      {
        title: "Eligibility & How to Qualify",
        type: "content",
        contentBlocks: [
          textBlock(
            "Who can compete: high school seniors or college students (any year). Each chapter selects one nominee and one backup/runner-up — selection is made by the chapter lead.\n\n" +
              "How to qualify: complete the Robotic Arm Academy course (all 5 modules) and demonstrate each milestone on video. Your chapter lead reviews and verifies your recordings before submitting your nomination. Start early — the milestone ladder is designed to be worked through over several weeks, not crammed in a weekend.\n\n" +
              "If you're not sure who your chapter lead is or when your chapter's nomination deadline is, ask in your chapter first — deadlines are set by the national RACC coordinators and can shift year to year.",
          ),
        ],
        aiContext:
          "Student is asking about eligibility or how to become their chapter's nominee. This is a logistics/process question, not a coding one — the real answer routes through their chapter lead, not this platform. Encourage them to start the Robotic Arm Academy modules regardless of nomination status, since practice never hurts.",
      },
      {
        title: "Judging & Scoring",
        type: "content",
        contentBlocks: [
          textBlock(
            "Every challenge is scored out of 30 points, across four categories:\n\n" +
              "- Objective (varies by challenge, ~9-10 pts): did you actually accomplish the task — blocks sorted correctly, structure built to spec, obstacles left undisturbed?\n" +
              "- Time (0, 3, or 5 pts): scored against the average completion time of all competitors that challenge, not a fixed clock — finish faster than average for full points.\n" +
              "- Code Quality (0-5 pts): clean, readable, well-organized code. This is also where AI usage is judged — targeted questions and adapted suggestions you can explain are \"healthy\" use; unedited AI-generated solutions you can't explain will cost you here.\n" +
              "- Presentation (0-5 pts): how clearly you can explain your own solution to a judge.\n\n" +
              "Your final score is the sum across every challenge you attempt.",
          ),
        ],
        aiContext:
          "Student wants to understand how they'll be scored. Be precise about the 4-category breakdown (Objective/Time/Code Quality/Presentation) and be direct that Code Quality includes how the student uses AI tools — reinforce that they should be able to explain any code they submit, including anything an AI assistant helped write.",
      },
      {
        title: "Challenge: Stack Em' Up",
        type: "arm_challenge",
        contentBlocks: [
          textBlock(
            "Nine cube blocks (3 red, 3 green, 3 blue) arrive in a fixed, scrambled sequence. Using the Ultrasonic sensor to detect each block's arrival and the Color sensor to identify it, sort every block into its matching color stack.\n\n" +
              "Skills tested: conditionals, color sorting, sensor sequencing — this is exactly what the Academy's \"Color & Ultrasonic Sorting\" module trains for.\n\n" +
              "Scoring emphasizes correct sorting (Objective) and finishing at or faster than the competitor average (Time), on top of Code Quality and Presentation.",
          ),
        ],
        aiContext:
          "This maps to the real 'Stack Em' Up' RACC challenge. Interactive simulator not built yet — treat as reference material for now. If asked for code help, point back to the Academy's Color & Ultrasonic Sorting module.",
      },
      {
        title: "Challenge: Bridgerton Bridge",
        type: "arm_challenge",
        contentBlocks: [
          textBlock(
            "Build a two-arch drawbridge from 8 slab blocks and 2 arch blocks, using the Ultrasonic sensor. Build order matters — both arches must be placed before any roadway slab, or the structure (and your Objective score) won't hold up.\n\n" +
              "Skills tested: construction sequencing, spatial precision, planning multi-step builds — this is an extension of the Academy's sensor-triggered build skills applied to a larger structure.",
          ),
        ],
        aiContext:
          "This maps to the real 'Bridgerton Bridge' RACC challenge. Interactive simulator not built yet — treat as reference material. The key rule to reinforce: arches before roadway slabs, always.",
      },
      {
        title: "Challenge: Operation (Robot-Assisted Surgery)",
        type: "arm_challenge",
        contentBlocks: [
          textBlock(
            "Using the handheld Multi-Platform Controller — manual control, not autonomous code — extract three \"organ\" blocks from among surrounding obstacle blocks without knocking any of them over.\n\n" +
              "This is the one challenge that's about hands, not code: steady, deliberate control under time pressure. It's a direct payoff of the Academy's \"Precision: The Claw Machine\" module.\n\n" +
              "Each obstacle you disturb costs Objective points, so slow and careful beats fast and sloppy here.",
          ),
        ],
        aiContext:
          "This maps to the real 'Operation: Robot-Assisted Surgery' RACC challenge, which is manual teleoperation via a physical controller, not written code. An AI coding tutor has limited use here beyond general strategy advice — the skill is motor control, not programming. Note to future devs: this module will need a different interactive UI (on-screen controller) rather than a code editor once built out.",
      },
    ],
  },
];

for (const { title, description, order, modules } of COURSES) {
  const existing = await db.collection("courses").where("title", "==", title).limit(1).get();
  if (!existing.empty) {
    console.log(`skip "${title}" — already exists (${existing.docs[0].id})`);
    continue;
  }

  const courseRef = await db.collection("courses").add({
    title,
    description,
    order,
    moduleIds: [],
  });

  const moduleIds = [];
  for (const [i, m] of modules.entries()) {
    const moduleRef = await db.collection("modules").add({
      courseId: courseRef.id,
      title: m.title,
      order: i + 1,
      type: m.type,
      contentBlocks: m.contentBlocks,
      aiContext: m.aiContext,
    });
    moduleIds.push(moduleRef.id);
  }
  await courseRef.update({ moduleIds });

  console.log(`created "${title}" (${courseRef.id}) with ${moduleIds.length} modules`);
}

console.log("done");
