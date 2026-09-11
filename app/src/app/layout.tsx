import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LeadIntel — AI Lead Intelligence & CALL-E Platform",
  description:
    "AI-powered lead research, evidence-based scoring, and phone qualification through CALL-E.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
