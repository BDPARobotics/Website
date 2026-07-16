"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { SignOutButton } from "@/components/sign-out-button";

const MARKETING_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/robot-arm-challenge", label: "Robot Arm Challenge" },
];

// Signed-in students see the LMS nav instead of the marketing pages.
const STUDENT_LINKS = [
  { href: "/dashboard", label: "Modules" },
  { href: "/dashboard/lectures", label: "Lectures" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/winners", label: "Winners" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(getFirebaseAuth(), async (u) => {
        setAuthed(!!u);
        if (!u) {
          setIsAdmin(false);
          return;
        }
        const token = await u.getIdTokenResult();
        setIsAdmin(token.claims.role === "admin");
      }),
    [],
  );

  const navLinks = authed
    ? [...STUDENT_LINKS, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])]
    : MARKETING_LINKS;

  return (
    <header className="bg-tertiary sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo.png"
            alt="BDPA Robotics"
            width={160}
            height={34}
            priority
            className="h-auto w-[140px] sm:w-[160px]"
          />
        </Link>

        <ul className="hidden items-center gap-8 xl:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-[#233242] transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 xl:flex">
          {authed ? (
            <SignOutButton />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#233242]/20 xl:hidden"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-[#233242]/10 xl:hidden">
          <ul className="container mx-auto flex flex-col gap-1 px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-[#233242] hover:bg-primary/5 hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="container mx-auto flex gap-3 px-4 pb-4 sm:px-6">
            {authed ? (
              <SignOutButton />
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md border border-primary px-4 py-2 text-center text-sm font-medium text-primary"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
