export function validateLectureBody(body: Record<string, unknown>) {
  const errors: string[] = [];
  if (typeof body.title !== "string" || !body.title.trim()) errors.push("title required");
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push("date must be YYYY-MM-DD");
  }
  for (const key of ["description", "recordingUrl", "slidesUrl"]) {
    if (body[key] !== undefined && typeof body[key] !== "string") errors.push(`invalid ${key}`);
  }
  return errors;
}

// Turns YouTube watch/share links into embeddable URLs; null for anything else.
export function youTubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
