import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about BDPA Robotics, a program of Black Data Processing Associates, and meet the staff behind it.",
};

const STAFF = [
  {
    name: "Regan Scruggs",
    role: "Program Champion",
    image: "/images/about/team1.jpeg",
  },
  {
    name: "Dr. Michael G. Wulf",
    role: "Program Director",
    image: "/images/about/team2.jpeg",
  },
  {
    name: "Kareem DaSilva",
    role: "Head Instructor",
    image: "/images/about/team3.jpeg",
  },
  {
    name: "Morgan Collingwood",
    role: "Program Facilitator",
    image: "/images/about/team4.jpeg",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="py-16 sm:py-20">
        <div className="container mx-auto grid items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-bold tracking-wide text-primary uppercase">
              About BDPA Robotics
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#233242] sm:text-4xl">
              From the classroom to the boardroom
            </h1>
            <div className="mt-5 space-y-4 text-[#4a5568]">
              <p>
                For more than 40 years, BDPA has enabled the upward mobility
                of African Americans and other minorities in the Information
                Technology (IT) and STEM fields. Through its 30+ local
                community chapters in major cities across the United States,
                BDPA has been at the forefront of promoting the minority
                agenda within the IT profession since 1975.
              </p>
              <p>
                Founded in 2023 with sponsorship from Johnson &amp; Johnson&rsquo;s
                esteemed CIO Larry Jones, BDPA Robotics is driven by the noble
                vision of cultivating an all-embracing community of Black
                roboticists. Our heartfelt mission is to empower and nurture
                individuals on their journey from the classroom to the
                boardroom.
              </p>
            </div>
          </div>
          <div>
            <Image
              src="/images/about/RoboLogo.png"
              alt="BDPA Robotics logo"
              width={500}
              height={500}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      <section className="bg-tertiary py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-bold tracking-wide text-primary uppercase">
              Staff
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#233242]">
              People Behind Us
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STAFF.map((member) => (
              <div key={member.name} className="text-center">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 45vw, 22vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 font-semibold text-[#233242]">
                  {member.name}
                </h3>
                <p className="text-sm text-[#888888]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
