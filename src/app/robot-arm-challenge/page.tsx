import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BannerShapes } from "@/components/banner-shapes";

export const metadata: Metadata = {
  title: "Robot Arm Challenge",
  description:
    "Join the BDPA Robotics Arm Challenge at the 45th BDPA Annual Conference.",
};

export default function RobotArmChallengePage() {
  return (
    <>
      <section className="bg-tertiary relative overflow-hidden py-16 sm:py-20">
        <div className="container relative mx-auto grid items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl leading-tight font-bold text-[#233242] sm:text-4xl">
              We invite you to the BDPA Robotics Arm Challenge at our 45th
              BDPA Annual Conference.
            </h1>
            <p className="mt-4 text-lg text-[#4a5568]">
              Students: log in to read the challenge question and work through
              it with your AI tutor — it&apos;s waiting on your dashboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/dashboard"
                className="rounded-md bg-primary px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Enter the Challenge
              </Link>
              <Link
                href="/signup"
                className="rounded-md border-2 border-primary px-8 py-4 text-lg font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Create Account
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/images/about/bdpaFlyer.jpeg"
              alt="BDPA Robotics Arm Challenge flyer"
              width={1440}
              height={1440}
              priority
              className="w-full max-w-md rounded-lg"
            />
          </div>
        </div>
        <BannerShapes />
      </section>

      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <Image
            src="/images/banner/RoboticFlyer.png"
            alt="BDPA Robotics Arm Challenge event details"
            width={1920}
            height={1080}
            className="w-full rounded-lg"
          />
        </div>
      </section>
    </>
  );
}
