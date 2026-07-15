"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/robot-arm-challenge", label: "Robot Arm Challenge" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
          {NAV_LINKS.map((link) => (
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
          <a
            href="https://moodle-134519-0.cloudclusters.net/login/index.php"
            className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Log In
          </a>
          <a
            href="https://moodle-134519-0.cloudclusters.net/login/signup.php"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Sign Up
          </a>
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
            {NAV_LINKS.map((link) => (
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
            <a
              href="https://moodle-134519-0.cloudclusters.net/login/index.php"
              className="flex-1 rounded-md border border-primary px-4 py-2 text-center text-sm font-medium text-primary"
            >
              Log In
            </a>
            <a
              href="https://moodle-134519-0.cloudclusters.net/login/signup.php"
              className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-white"
            >
              Sign Up
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
