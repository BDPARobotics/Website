# BDPA Robotics Platform — Build Plan

Custom LMS replacing the current Moodle instance linked from bdparobotics.org.
Core differentiator: an AI tutor scoped to each module's content, plus a
browser-based robot arm simulator that mirrors our physical SO-101 competition arm.

Stack: Next.js (this repo, App Router) · Firebase Auth/Firestore/Storage
(project `beseen-16a9d`) · Claude API (tutor) · Resend (email) · Vercel (hosting).

## Architecture decisions

**No Cloud Functions.** All privileged writes (progress, submissions, badges,
emails) go through Next.js route handlers using `firebase-admin`. Badge checks
and transactional email run inline in those routes. Scheduled email = Vercel
Cron hitting routes guarded by `CRON_SECRET`. No Blaze plan, one deploy target,
trivial streaming. Revisit only if something outside this app starts writing
to Firestore.

**Client Firestore access is read-only.** `firestore.rules` denies all client
writes; clients read their own data (role-scoped). This also closes the
autograder-tampering hole — the submission route is the only writer.

**Auth.** Firebase Auth on the client, exchanged for an httpOnly session
cookie (`src/lib/auth/session.ts`). `role` lives in custom claims
(student | mentor | admin). First admin gets bootstrapped by a one-off script.

**The simulator arm is the SO-101.** We own the physical arm (`~/code/robot`,
Python over scservo_sdk, URDF model available). The student-facing sim API
uses the real joint names — `shoulder_pan`, `shoulder_lift`, `elbow_flex`,
`wrist_flex`, `wrist_roll`, `gripper` (see `SO101_JOINTS` in
`src/lib/types.ts`) — and the URDF drives the Three.js render (urdf-loader +
React Three Fiber). Students practice in the browser on the same arm they'll
run at the BDPACON Robot Arm Challenge. Joint limits/speeds come from the
amplitudes in `~/code/robot/full_arm.py`.

**AI tutor.** `POST /api/ai/chat`: verify session → load `modules.aiContext`
(hand-written condensed summary, not raw content) + last N chat messages →
stream `claude-sonnet-5` → persist to `chat_sessions` after the stream closes.
For arm modules, the client also sends current code + last run results.
`hintLevel` (0–2) is tracked per session and injected into the prompt:
nudge → stronger hint → full solution only after repeated failures.

## Schema

Documented as TypeScript types in `src/lib/types.ts` (users, chapters,
courses, modules, progress, badges, chat_sessions, submissions,
notifications_log). Timestamps are epoch ms. IDs: `progress/{uid}_{moduleId}`,
`chat_sessions/{uid}_{moduleId}`, `submissions/{uid}_{moduleId}_{attemptNum}`.

## Phases

- [x] **Phase 0 — Foundation.** Firebase deps + env wiring, client/admin
  singletons (`src/lib/firebase/`), session-cookie auth helpers,
  `firestore.rules` + emulator config. Firebase project: `optimize-freight-usa`
  (repurposed dead project). Email/password sign-in enabled via
  `scripts/provision-firebase.mjs`; service account key in `.env.local`;
  Vercel project `bdpa-robotics` linked (GitHub BDPARobotics/Website connected)
  with all env vars in production/preview/development.
  Remaining manual steps: create the default Firestore database in the console
  (service account lacks permission), enable the Google sign-in provider,
  then `npx firebase-tools deploy --only firestore:rules` and bootstrap the
  first admin with `scripts/set-role.mjs`.
- [ ] **Phase 1 — Content LMS.** Auth flow DONE: /signup (with chapter +
  university), /login, Google button, session cookies, first-login role
  bootstrap, /dashboard shell, header links point at /login + /signup instead
  of Moodle. Remaining: admin CRUD for courses/modules (aiContext as a plain
  textarea), student course/module views, `POST /api/progress` with inline
  streak update.
- [ ] **Phase 2 — AI tutor.** `/api/ai/chat` streaming route (Vercel AI SDK),
  chat panel in module view, per-uid daily message cap.
- [ ] **Phase 3 — Badges + email.** `lib/badges` checked inline from
  progress/submission routes. Resend: verify sending domain EARLY (DNS lag is
  the usual blocker). Welcome + module-complete emails first. React Email
  templates in `/emails`.
- [ ] **Phase 4 — Arm challenge.** Build order: URDF scene render → hardcoded
  script playback + success-condition check → Web Worker sandbox running
  student JS against the arm API (fixed tick loop, step budget) → autograder +
  submission route → AI tutor wired to live code/results → arm badges.
  Keep the sim in `src/sim/` with no DOM dependencies so it can later re-run
  headless server-side to validate suspicious submissions.
- [ ] **Phase 5 — Scheduled email + leaderboard.** Vercel Cron: 5-day
  inactivity nudge, weekly digest. Challenge leaderboard.

## Context

- BDPA: national nonprofit (est. 1975), 30+ chapters; student pipeline =
  SITES, HSCC, IT Showcase, all culminating at BDPACON (2026: July 15–18,
  Indianapolis). BDPA Robotics founded 2023 (J&J sponsorship); Robot Arm
  Challenge runs at the annual conference — this platform targets the fall
  2026 cohort (applications close Aug 30) and the 2027 challenge season.
- Decisions on the spec's open questions: single curriculum for all chapters
  (chapterId is the seam if that changes); AI tutor text-only at MVP (vision
  is a prompt change later, not an architecture change); sim API mirrors the
  SO-101 rather than a generic arm.
- The old static site (root *.html files) still serves bdparobotics.org via
  GitHub Pages; the Next.js app in `src/` replaces it. The stray loan-service
  text on the static about.html dies with that migration.
