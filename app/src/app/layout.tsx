import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "DIAL O — Lead Intelligence Before Outreach",
  description:
    "Decides which calls deserve to happen in the first place. AI lead intelligence, evidence synthesis, and CALL-E phone qualification.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased font-modular selection:bg-[#00FFFF] selection:text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}