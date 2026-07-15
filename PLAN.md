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

**The competition arm is the Hiwonder MaxArm** (confirmed by Kareem; it's in
the seeded RACC curriculum): ESP32-based, programmed in Arduino C++ or
MicroPython, with ultrasonic/color/sound/touch sensors. The AI tutor's
hardware reference (`MAXARM_REFERENCE` in `src/lib/ai/prompts.ts`) and the
future simulator target the MaxArm. Kareem's personal SO-101 (`~/code/robot`,
URDF available) can return later as a second sim profile if useful.

**Challenge submissions (shipped ahead of the simulator).** Students on
`arm_challenge` modules submit the code they ran on the physical kit:
language (C++/MicroPython), code, notes, optional proof-of-run video link →
`submissions/{uid}_{moduleId}_{attemptNum}`. Mentors/admins review at
`/admin/submissions` and leave feedback (status → reviewed); students see
feedback on the module page. The tutor automatically reads the latest
submission when chatting on a challenge module. Deleting a module cascades to
its progress/chat_sessions/submissions (`src/lib/firebase/cascade.ts`).

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
  Firestore + Storage enabled; rules for both deployed via the Firebase Rules
  REST API (scripts couldn't use firebase-tools — the service account lacks
  serviceusage perms; same reason composite indexes can't be deployed from
  here, so queries sort in memory for now and firestore.indexes.json waits for
  an owner-credentialed deploy). Admin bootstrapped: kareemdasilva@gmail.com.
- [ ] **Phase 1 — Content LMS.** Auth DONE: /signup (chapter + university),
  /login, Google button (provider enabled in console), session cookies,
  first-login role bootstrap, /dashboard shell, header links point at /login +
  /signup instead of Moodle. Admin mode DONE: /admin (role-gated layout +
  overview counts), /admin/users (role management), /admin/courses +
  /admin/modules CRUD with content-block editor and aiContext field; all
  mutations behind admin-gated API routes; smoke-tested end-to-end against
  live Firebase. Student views DONE (dashboard course list + module page with
  content renderer, by the other agent). `POST /api/progress` DONE with inline
  streak update + Mark-as-complete button.
- [x] **Phase 2 — AI tutor.** Provider decision changed: **Gemini**
  (GEMINI_API_KEY/GEMINI_MODEL env, default gemini-3.1-flash-lite) via raw REST
  SSE — no SDK dependency (`src/lib/ai/gemini.ts`). `/api/ai/chat`: GET history,
  POST streams the reply and persists to `chat_sessions/{uid}_{moduleId}`;
  system prompt built from module aiContext (`src/lib/ai/prompts.ts`, includes
  the SO-101 arm API reference for arm_challenge modules + optional live
  code/lastResults from the client); 50 msgs/day/user cap in `ai_usage`.
  Chat panel lives in the student module view. Smoke-tested with a live
  Gemini call — context injection verified.
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
