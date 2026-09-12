import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AIBackground } from "@/components/ai-background";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AladdinAI — Find Leads. Make Calls. Work Like Magic.",
  description:
    "AladdinAI is your 24/7 AI agent that finds high-quality leads, makes calls, and books meetings — work like magic with Arabian cyber-luxe intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${cinzel.variable}`}>
      <body className="font-sans antialiased bg-[#030614] text-[#f8fafc] selection:bg-[#f59e0b]/30 selection:text-[#fef08a] overflow-x-hidden min-h-screen">
        <AIBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}