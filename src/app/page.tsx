import Image from "next/image";
import Link from "next/link";
import { BannerShapes } from "@/components/banner-shapes";

const APPLY_URL = "https://form.jotform.com/251310814390044";

const MOSAIC = [
  { src: "/images/landing/photo1.jpg", alt: "BDPA Robotics students at work", width: 678, height: 452 },
  { src: "/images/about/team1.jpeg", alt: "A BDPA Robotics team", width: 500, height: 500 },
  { src: "/images/landing/robotics-team.jpg", alt: "BDPA Robotics team with their build", width: 509, height: 339 },
  { src: "/images/about/team2.jpeg", alt: "Students in a robotics session", width: 404, height: 404 },
  { src: "/images/landing/academy.jpg", alt: "Robotic Arm Academy session", width: 259, height: 194 },
  { src: "/images/about/team3.jpeg", alt: "BDPA Robotics students", width: 400, height: 400 },
  { src: "/images/landing/photo6.jpg", alt: "Robotics workshop", width: 259, height: 194 },
  { src: "/images/about/team4.jpeg", alt: "BDPA Robotics crew", width: 293, height: 293 },
];

const AUDIENCES = ["Middle School", "High School", "College"];

const STATS = [
  { value: "6-DOF", label: "Real robot arms" },
  { value: "24/7", label: "AI tutor built in" },
  { value: "5", label: "Academy modules" },
  { value: "3", label: "Competition events" },
];

const FEATURES = [
  { title: "AI tutor in every lesson", detail: "Stuck? Ask. It knows your module and your code." },
  { title: "Real robot arms", detail: "Program the MaxArm — sensors, motion, autonomy." },
  { title: "Mentors on every run", detail: "Submit your code. Get real feedback." },
  { title: "Compete at nationals", detail: "The Robot Arm Coding Competition." },
];

const CHALLENGES = [
  { name: "Bridgerton Bridge", tagline: "Precision assembly" },
  { name: "Stack Em' Up", tagline: "Sensor-driven stacking" },
  { name: "Operation", tagline: "Live teleoperation" },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-tertiary relative overflow-hidden py-14 sm:py-20">
        <div className="container relative mx-auto grid items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            <p className="text-sm font-bold tracking-widest text-primary uppercase">
              BDPA Robotics · 2027 Season
            </p>
            <h1 className="mt-4 text-5xl leading-none font-bold text-[#233242] sm:text-6xl lg:text-7xl">
              Learn
              <br />
              Robotics.
            </h1>
            <p className="mt-5 text-xl font-medium text-[#4a5568] sm:text-2xl">
              Physical AI for youth — middle school, high school & college.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#51b56d]/15 px-5 py-2 text-base font-semibold text-[#2e7d46]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#51b56d]" />
              2027 — enrolling now
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href={APPLY_URL}
                className="rounded-md bg-primary px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Apply Now
              </a>
              <Link
                href="/login"
                className="rounded-md border-2 border-primary px-8 py-4 text-lg font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Log In
              </Link>
            </div>
          </div>

          {/* Photo collage */}
          <div className="grid grid-cols-2 gap-3">
            <Image
              src="/images/landing/morning2.jpg"
              alt="BDPA students at the national conference"
              width={2048}
              height={3078}
              priority
              className="row-span-2 h-full max-h-[480px] w-full rounded-2xl object-cover shadow-lg"
            />
            <Image
              src="/images/landing/conference-full.jpg"
              alt="BDPA students together at BDPACON"
              width={2048}
              height={1362}
              priority
              className="h-[232px] w-full rounded-2xl object-cover shadow-lg"
            />
            <Image
              src="/images/landing/banquet.jpg"
              alt="Students celebrating at the BDPA banquet"
              width={2048}
              height={1365}
              className="h-[232px] w-full rounded-2xl object-cover shadow-lg"
            />
          </div>
        </div>
        <BannerShapes />
      </section>

      {/* Who it's for */}
      <section className="container mx-auto px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div
              key={a}
              className="rounded-2xl border-2 border-[#eaeaea] py-8 text-center text-2xl font-bold text-[#233242] sm:text-3xl"
            >
              {a}
            </div>
          ))}
        </div>
      </section>

      {/* Photo mosaic */}
      <section className="container mx-auto px-4 pb-12 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOSAIC.map((g) => (
            <Image
              key={g.src}
              src={g.src}
              alt={g.alt}
              width={g.width}
              height={g.height}
              className="h-40 w-full rounded-xl object-cover sm:h-48"
            />
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-primary py-12">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 text-center sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-white sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-base text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="py-14 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-center text-4xl font-bold text-[#233242] sm:text-5xl">
            Build. Code. Compete.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="rounded-2xl border border-[#eaeaea] bg-white p-6 text-center">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-primary ${
                    i % 2 === 0 ? "bg-[#51b56d]/20" : "bg-[#917aeb]/20"
                  }`}
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#233242]">{f.title}</h3>
                <p className="mt-2 text-[#4a5568]">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="bg-tertiary py-14 sm:py-16">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <h2 className="text-4xl font-bold text-[#233242] sm:text-5xl">Three events. One arm.</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {CHALLENGES.map((c, i) => (
              <div key={c.name} className="rounded-2xl border border-[#eaeaea] bg-white p-8">
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                    i % 2 === 0 ? "bg-[#51b56d]/15 text-[#2e7d46]" : "bg-[#917aeb]/15 text-[#5f4bb6]"
                  }`}
                >
                  {c.tagline}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-[#233242]">{c.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Path */}
      <section className="container mx-auto px-4 py-14 text-center sm:px-6">
        <p className="text-3xl font-bold text-[#233242] sm:text-4xl">
          Apply <span className="text-primary">→</span> Train{" "}
          <span className="text-primary">→</span> Build{" "}
          <span className="text-primary">→</span> Compete
        </p>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">2027 enrollment is open.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={APPLY_URL}
              className="rounded-md bg-white px-8 py-4 text-lg font-bold text-primary transition-colors hover:bg-gray-100"
            >
              Apply Now
            </a>
            <Link
              href="/signup"
              className="rounded-md border-2 border-white/60 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
