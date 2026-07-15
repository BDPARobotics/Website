import Image from "next/image";
import Link from "next/link";
import { BannerShapes } from "@/components/banner-shapes";

const APPLY_URL = "https://form.jotform.com/251310814390044";

const STATS = [
  { value: "6-DOF", label: "Hiwonder MaxArm kit on ESP32" },
  { value: "24/7", label: "AI tutor inside every module" },
  { value: "5", label: "Academy modules, wiring to autonomy" },
  { value: "3", label: "Competition challenge events" },
];

const PLATFORM_FEATURES = [
  {
    title: "An AI tutor that knows your module",
    description:
      "Every lesson and challenge has a built-in tutor that reads your code and your latest submission, then coaches you through the fix — hints first, never just the answer.",
    accent: "bg-[#51b56d]/20",
  },
  {
    title: "Your first Physical AI system",
    description:
      "The Hiwonder MaxArm senses the world through ultrasonic, color, sound, and touch — and acts on what it detects. You program the intelligence in Arduino C++ or MicroPython.",
    accent: "bg-[#917aeb]/20",
  },
  {
    title: "Submit runs, get mentor feedback",
    description:
      "Upload your challenge code with a video of your run. A BDPA mentor reviews every attempt and tells you exactly what to try next.",
    accent: "bg-[#917aeb]/20",
  },
  {
    title: "Track your climb",
    description:
      "Work up the five-module Robotic Arm Academy ladder — from wiring your first sensor to full autonomous and manual control — with your progress saved every step.",
    accent: "bg-[#51b56d]/20",
  },
];

const CHALLENGES = [
  {
    name: "Bridgerton Bridge",
    tagline: "Precision assembly",
    description:
      "Program the arm to build a bridge in the right order — arches before roadway slabs, always. One misplaced piece ends the run.",
  },
  {
    name: "Stack Em' Up",
    tagline: "Sensor-driven stacking",
    description:
      "Put your color and ultrasonic sorting skills to work: identify, pick, and stack pieces with repeatable precision on the grid mat.",
  },
  {
    name: "Operation: Robot-Assisted Surgery",
    tagline: "Live teleoperation",
    description:
      "No autopilot here — you drive the arm live with a physical controller in a steady-hands, surgery-style event.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Apply",
    description: "Applications for the January 2027 cohort are open now.",
  },
  {
    step: "2",
    title: "Train",
    description:
      "Work through the Robotic Arm Academy with an AI tutor and real mentors behind you.",
  },
  {
    step: "3",
    title: "Build & submit",
    description:
      "Run the challenges on your MaxArm, submit your code and videos, and iterate on feedback.",
  },
  {
    step: "4",
    title: "Compete",
    description:
      "Represent your chapter at the Robot Arm Coding Competition at the BDPA National Conference.",
  },
];

const REASONS = [
  {
    number: "01",
    title: "In Depth Tutorials",
    description: "Learn how to program robots and hardware through our exclusive tutorials",
  },
  {
    number: "02",
    title: "Inclusive Community",
    description: "Join a network of roboticists who freely share knowledge and opportunities",
  },
  {
    number: "03",
    title: "Exclusive Lectures",
    description:
      "Watch in-person or virtually as esteemed leaders in robotics cover advanced topics",
  },
  {
    number: "04",
    title: "Invite-Only Workshops",
    description: "Get invited to learn robotics in person at our invite-only workshops",
  },
  {
    number: "05",
    title: "Access to Digital Library",
    description:
      "Our library consists of research papers, tutorials, and schematics on the latest advancements in robotics",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-tertiary relative overflow-hidden py-16 sm:py-24">
        <div className="container relative mx-auto grid items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="text-sm font-bold tracking-widest text-primary uppercase">
              2027 Season · Robot Arm Coding Competition
            </p>
            <h1 className="mt-4 text-4xl leading-tight font-bold text-[#233242] sm:text-5xl">
              Learn Physical AI.
              <br />
              Command the arm.
              <br />
              <span className="text-primary">Compete.</span>
            </h1>
            <p className="mt-6 text-lg text-[#4a5568]">
              AI is stepping off the screen and into the real world. BDPA Robotics trains
              Black and Brown students in Physical AI — programming robot arms that sense,
              decide, and act — all the way to the Robot Arm Coding Competition.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#51b56d]/15 px-4 py-1.5 text-sm font-medium text-[#2e7d46]">
              <span className="h-2 w-2 rounded-full bg-[#51b56d]" />
              Now enrolling — January 2027 cohort
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href={APPLY_URL}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Apply for January 2027
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-md border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Explore the Academy
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#888888]">
              A program of BDPA — advancing Black technologists since 1975.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src="/images/bdpaDevs.png"
              alt="BDPA Robotics students"
              width={635}
              height={635}
              priority
              className="w-full max-w-md"
            />
          </div>
        </div>
        <BannerShapes />
      </section>

      {/* Stats band */}
      <section className="bg-primary py-10">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 text-center sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold tracking-wide text-primary uppercase">
              New for 2026
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#233242]">
              Where Physical AI is learned by doing
            </h2>
            <p className="mt-4 text-[#4a5568]">
              Physical AI is intelligence that acts in the real world — machines that sense
              their surroundings, decide, and move. It&apos;s the fastest-growing frontier in
              tech, and our academy platform teaches it the only way that sticks: code,
              submit, get feedback, repeat.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-[#F4F4F4] bg-white p-6">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${f.accent}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#233242]">{f.title}</h3>
                <p className="mt-2 text-[#4a5568]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="bg-tertiary py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold tracking-wide text-primary uppercase">
              The competition
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#233242]">
              Three events. One robot arm.
            </h2>
            <p className="mt-4 text-[#4a5568]">
              Every Academy module builds toward the three official RACC challenge events —
              Physical AI, proven on the competition mat.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {CHALLENGES.map((c, i) => (
              <div
                key={c.name}
                className="flex flex-col rounded-xl border border-[#F4F4F4] bg-white p-6"
              >
                <span
                  className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${
                    i % 2 === 0 ? "bg-[#51b56d]/15 text-[#2e7d46]" : "bg-[#917aeb]/15 text-[#5f4bb6]"
                  }`}
                >
                  {c.tagline}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#233242]">{c.name}</h3>
                <p className="mt-2 text-[#4a5568]">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Path */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-[#233242]">
            Your path to the competition floor
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#233242]">{s.title}</h3>
                <p className="mt-2 text-sm text-[#4a5568]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why BDPA Robotics */}
      <section className="bg-tertiary py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-x-8 gap-y-10 lg:grid-cols-3">
            <div className="pt-4">
              <p className="text-sm font-bold tracking-wide text-primary uppercase">
                We are BDPA Robotics
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[#233242]">
                Five reasons to join BDPA Robotics
              </h2>
              <p className="mt-4 text-[#4a5568]">
                BDPA Robotics is a program within the{" "}
                <a href="https://BDPA.org" className="font-medium text-primary hover:underline">
                  Black Data Processing Associates organization
                </a>{" "}
                that focuses on engaging and educating young individuals in the field of
                robotics and technology.
              </p>
            </div>

            {REASONS.map((reason, i) => (
              <div key={reason.number} className="border-t border-[#eaeaea] pt-8">
                <span
                  className={`inline-flex h-[70px] w-[70px] items-center justify-center rounded-lg text-xl font-bold text-primary ${
                    i % 2 === 0 ? "bg-[#51b56d]/20" : "bg-[#917aeb]/20"
                  }`}
                >
                  {reason.number}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#233242]">{reason.title}</h3>
                <p className="mt-2 text-[#888888]">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">
            Join the generation building Physical AI.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            The 2027 season starts in January and applications are open now. Spots are
            limited — get your chapter nomination in early.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={APPLY_URL}
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-gray-100"
            >
              Apply for January 2027
            </a>
            <Link
              href="/login"
              className="rounded-md border border-white/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Already enrolled? Log in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
