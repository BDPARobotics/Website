import { EVENT_TYPES, type EventType } from "@/lib/types";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  competition: "Competition",
  workshop: "Workshop",
  deadline: "Deadline",
  meeting: "Meeting",
  other: "Other",
};

export function validateEventBody(body: Record<string, unknown>) {
  const errors: string[] = [];
  if (typeof body.title !== "string" || !body.title.trim()) errors.push("title required");
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push("date must be YYYY-MM-DD");
  }
  if (typeof body.type !== "string" || !EVENT_TYPES.includes(body.type as EventType)) {
    errors.push("invalid type");
  }
  for (const key of ["description", "time", "location", "link"]) {
    if (body[key] !== undefined && typeof body[key] !== "string") errors.push(`invalid ${key}`);
  }
  return errors;
}
