import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import type { Role } from "@/lib/types";

// For server components/pages: redirects instead of throwing.
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

// For route handlers: returns an error response the caller must return.
// Usage: const gate = await requireApiRole("admin");
//        if (gate instanceof NextResponse) return gate;
export async function requireApiRole(...roles: Role[]): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!user.role || !roles.includes(user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return user;
}
