"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithGoogle, signUpWithEmail } from "@/lib/auth/client";
import { CHAPTER_REGIONS } from "@/lib/chapters";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    if (!chapterId) {
      setError("Please select a chapter.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await action();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message.replace("Firebase: ", "") : "Sign-up failed");
      setBusy(false);
    }
  }

  const profile = { chapterId: chapterId || null, university: university.trim() || null };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#233242]">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Start learning robotics with BDPA.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => signUpWithEmail(name, email, password, profile));
          }}
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#233242]">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
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
            <label htmlFor="password" className="block text-sm font-medium text-[#233242]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="chapter" className="block text-sm font-medium text-[#233242]">
              BDPA chapter
            </label>
            <select
              id="chapter"
              required
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                Select your chapter
              </option>
              {CHAPTER_REGIONS.map((group) => (
                <optgroup key={group.region} label={group.region}>
                  {group.chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="university" className="block text-sm font-medium text-[#233242]">
              School / University <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="university"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Morgan State University"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => signInWithGoogle(profile))}
          className="mt-3 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-[#233242] transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
