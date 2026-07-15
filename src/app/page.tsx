import Image from "next/image";
import { BannerShapes } from "@/components/banner-shapes";

const REASONS = [
  {
    number: "01",
    title: "In Depth Tutorials",
    description:
      "Learn how to program robots and hardware through our exclusive tutorials",
  },
  {
    number: "02",
    title: "Inclusive Community",
    description:
      "Join a network of roboticists who freely share knowledge and opportunities",
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
      <section className="bg-tertiary relative overflow-hidden py-16 sm:py-20">
        <div className="container relative mx-auto grid items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl leading-tight font-bold text-[#233242] sm:text-4xl lg:text-5xl">
              Fall Applications Open July 5th &ndash; August 30th
            </h1>
            <p className="mt-6 text-lg text-[#4a5568]">
              Our academy is dedicated to empowering Black and Brown students
              with cutting-edge skills in robotics.
            </p>
            <a
              href="https://form.jotform.com/251310814390044"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Apply Today Now
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

      <section className="py-16 sm:py-20">
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
                <a
                  href="https://BDPA.org"
                  className="font-medium text-primary hover:underline"
                >
                  Black Data Processing Associates organization
                </a>{" "}
                that focuses on engaging and educating young individuals in
                the field of robotics and technology.
              </p>
            </div>

            {REASONS.map((reason, i) => (
              <div key={reason.number} className="border-t border-[#F4F4F4] pt-8">
                <span
                  className={`inline-flex h-[70px] w-[70px] items-center justify-center rounded-lg text-xl font-bold text-primary ${
                    i % 2 === 0 ? "bg-[#51b56d]/20" : "bg-[#917aeb]/20"
                  }`}
                >
                  {reason.number}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#233242]">
                  {reason.title}
                </h3>
                <p className="mt-2 text-[#888888]">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
