import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bdparobotics.org"),
  title: {
    template: "%s | BDPA Robotics",
    default: "BDPA Robotics",
  },
  description:
    "BDPA Robotics empowers Black and Brown students with cutting-edge skills in robotics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-us" className={`${rubik.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
      <GoogleAnalytics gaId="G-ZM266NFYHZ" />
    </html>
  );
}
