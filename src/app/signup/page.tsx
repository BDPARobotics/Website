import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  // Already signed in — straight to the dashboard, no form.
  if (await getSessionUser()) redirect("/dashboard");
  return <SignupForm />;
}
