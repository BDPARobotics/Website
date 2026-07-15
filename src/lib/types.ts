// Firestore document shapes for the BDPA Robotics platform.
// Timestamps are epoch milliseconds (written server-side with Date.now())
// so the same types work with both the client and admin SDKs.

export type Role = "student" | "mentor" | "admin";

// ---------- users/{uid} ----------

export interface UserDoc {
  role: Role;
  chapterId: string | null;
  university: string | null;
  displayName: string;
  email: string;
  badgeIds: string[];
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string; // YYYY-MM-DD
  };
  createdAt: number;
}

// ---------- chapters/{chapterId} ----------

export interface Chapter {
  name: string;
  region: string;
  mentorIds: string[];
}

// ---------- courses/{courseId} ----------

export interface Course {
  title: string;
  description: string;
  order: number;
  moduleIds: string[];
}

// ---------- modules/{moduleId} ----------

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language?: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "video"; url: string }
  | { type: "pdf"; url: string };

export type ModuleType = "content" | "arm_challenge";

export interface Module {
  courseId: string;
  title: string;
  order: number;
  type: ModuleType;
  contentBlocks: ContentBlock[];
  // Condensed summary injected into the AI tutor's system prompt —
  // authored by hand at MVP, never the raw contentBlocks.
  aiContext: string;
  quizId?: string;
  badgeOnComplete?: string;
  armChallenge?: ArmChallenge;
}

// ---------- arm challenge (the RACC kit: Hiwonder MaxArm on ESP32) ----------

export const MAXARM_SENSORS = ["ultrasonic", "color", "sound", "touch"] as const;
export type MaxArmSensor = (typeof MAXARM_SENSORS)[number];

export const SUBMISSION_LANGUAGES = ["cpp", "micropython", "other"] as const;
export type SubmissionLanguage = (typeof SUBMISSION_LANGUAGES)[number];

export type ArmChallengeDifficulty = "intro" | "intermediate" | "competition";

export interface SceneObject {
  id: string;
  shape: "cube" | "cylinder" | "sphere";
  position: [number, number, number];
  size: number;
}

export interface TargetZone {
  id: string;
  position: [number, number, number];
  radius: number;
}

export interface SceneConfig {
  objects: SceneObject[];
  targetZones: TargetZone[];
  armStart: Record<string, number>; // joint name → degrees
}

export interface SolutionTest {
  id: string;
  description: string;
  initialState: SceneConfig;
  successCondition: {
    objectId: string;
    targetZone: string;
    maxTimeSec: number;
    maxMoves?: number;
  };
}

export interface ArmChallenge {
  sceneConfig: SceneConfig;
  starterCode: string;
  solutionTests: SolutionTest[];
  difficulty: ArmChallengeDifficulty;
  timeLimitSec?: number;
}

// ---------- progress/{uid}_{moduleId} ----------

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface Progress {
  uid: string;
  moduleId: string;
  status: ProgressStatus;
  score?: number;
  completedAt?: number;
}

// ---------- badges/{badgeId} ----------

export type BadgeCriteriaType =
  | "module_complete"
  | "course_complete"
  | "streak"
  | "quiz_score"
  | "arm_challenge_complete"
  | "arm_challenge_no_hints"
  | "arm_challenge_fastest"
  | "manual";

export interface Badge {
  name: string;
  description: string;
  iconUrl: string;
  criteria: {
    type: BadgeCriteriaType;
    value: string | number;
  };
}

// ---------- chat_sessions/{uid}_{moduleId} ----------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface ChatSession {
  uid: string;
  moduleId: string;
  messages: ChatMessage[];
  // Escalating-hint ladder for arm challenges: 0 nudge → 2 solution-allowed.
  hintLevel: number;
  createdAt: number;
  updatedAt: number;
}

// ---------- submissions/{uid}_{moduleId}_{attemptNum} ----------

export interface TestResult {
  testId: string;
  passed: boolean;
  moves: number;
  timeSec: number;
}

export interface Submission {
  uid: string;
  moduleId: string;
  attemptNum: number;
  language: SubmissionLanguage;
  code: string;
  notes?: string;
  videoUrl?: string; // proof-of-run video for physical MaxArm challenges
  status: "submitted" | "reviewed";
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: number;
  // Filled by the future simulator autograder; absent for physical-kit submissions.
  results?: TestResult[];
  score?: number;
  passedAll?: boolean;
  submittedAt: number;
}

// ---------- notifications/{id} ----------
// Announcements pushed by admins/mentors, shown in the student notification tab.

export interface Notification {
  title: string;
  body: string;
  link?: string;
  createdBy: string;
  createdAt: number;
}

// ---------- notification_reads/{uid} ----------
// One doc per user: everything with createdAt <= lastReadAt is "read".

export interface NotificationRead {
  lastReadAt: number;
}

// ---------- notifications_log/{id} ----------

export type NotificationType =
  | "welcome"
  | "module_complete"
  | "badge_earned"
  | "inactivity_nudge"
  | "weekly_digest";

export interface NotificationLog {
  uid: string;
  type: NotificationType;
  sentAt: number;
  resendMessageId: string;
}
