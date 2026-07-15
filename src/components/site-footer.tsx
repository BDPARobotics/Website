import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-tertiary mt-auto border-t border-[#233242]/10">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Image
          src="/images/logo.png"
          alt="BDPA Robotics"
          width={140}
          height={30}
          className="h-auto w-[140px]"
        />
        <p className="max-w-md text-sm text-[#4a5568]">
          A program of{" "}
          <a
            href="https://BDPA.org"
            className="font-medium text-primary hover:underline"
          >
            Black Data Processing Associates
          </a>
          , empowering Black and Brown students with cutting-edge skills in
          robotics.
        </p>
        <p className="text-xs text-[#4a5568]">
          &copy; {year} BDPA Robotics. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
