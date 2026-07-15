export function validateWinnerBody(body: Record<string, unknown>) {
  const errors: string[] = [];
  const year = Number(body.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) errors.push("year must be a valid year");
  if (typeof body.teamName !== "string" || !body.teamName.trim()) errors.push("teamName required");
  if (typeof body.place !== "string" || !body.place.trim()) errors.push("place required");
  for (const key of ["challenge", "chapter", "members", "photoUrl", "description"]) {
    if (body[key] !== undefined && typeof body[key] !== "string") errors.push(`invalid ${key}`);
  }
  return errors;
}
