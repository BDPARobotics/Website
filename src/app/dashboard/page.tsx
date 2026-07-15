import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="container mx-auto px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#233242]">
            Welcome, {user.name ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{user.role ?? "student"}</span>
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        Your courses will appear here.
      </div>
    </main>
  );
}
