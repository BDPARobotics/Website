import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Already signed in — straight to the dashboard, no form.
  if (await getSessionUser()) redirect("/dashboard");
  return <LoginForm />;
}
