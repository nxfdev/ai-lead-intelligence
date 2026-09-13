"use client";

import React, { useState } from "react";
import { HeroExperience } from "@/components/dial-o/hero-experience";
import { WalkthroughSection } from "@/components/dial-o/walkthrough-section";
import { AboutArchitectureSection } from "@/components/dial-o/about-architecture-section";
import { ConsoleSection } from "@/components/dial-o/console-section";
import { SignInModal } from "@/components/dial-o/sign-in-modal";

export default function DialOMainPage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const handleExploreConsole = () => {
    const consoleElem = document.getElementById("console");
    if (consoleElem) {
      consoleElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="w-full bg-black text-white selection:bg-[#00FFFF] selection:text-black">
      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />

      {/* Page 1 (Hero) & Page 2 (Call Reveal) — Scroll-Scrubbed Cinematic Experience */}
      <HeroExperience
        onOpenSignIn={() => setIsSignInOpen(true)}
        onExploreConsole={handleExploreConsole}
      />

      {/* Page 3 — Video Walkthrough (Cyan Visual Field & Orange Step Cards) */}
      <WalkthroughSection />

      {/* Page 4 — About + Architecture (Tan / Orange Split & System Pipeline) */}
      <AboutArchitectureSection />

      {/* Page 5 — The Console (The Destination / Payoff: Call Logs, Lead Intelligence, Copilot) */}
      <ConsoleSection />
    </main>
  );
}