"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  restoreSession,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  // The session cookie may have expired while Firebase's browser storage
  // still remembers the user — mint a fresh cookie and skip the form.
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((ok) => {
      if (cancelled) return;
      if (ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setRestoring(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message.replace("Firebase: ", "") : "Sign-in failed");
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message.replace("Firebase: ", "") : "Could not send reset email",
      );
    } finally {
      setBusy(false);
    }
  }

  if (restoring) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <p className="text-sm text-gray-400">Signing you in…</p>
      </main>
    );
  }

  if (mode === "reset") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#233242]">Reset password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {resetSent ? (
            <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              If an account exists for <span className="font-medium">{email}</span>, a reset link
              is on its way. Check your inbox (and spam folder).
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleReset}>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-[#233242]">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setResetSent(false);
                setError(null);
              }}
              className="font-medium text-primary hover:underline"
            >
              Back to log in
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#233242]">Log in</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back to BDPA Robotics.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => signInWithEmail(email, password));
          }}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#233242]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-[#233242]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(signInWithGoogle)}
          className="mt-3 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-[#233242] transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
