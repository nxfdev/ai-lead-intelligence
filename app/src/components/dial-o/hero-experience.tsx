"use client";

import React, { useState } from "react";
import { User } from "lucide-react";
import { HeroVideo } from "./hero-video";
import { DialOLogo } from "./dial-o-logo";

interface HeroExperienceProps {
  onOpenSignIn: () => void;
  onExploreConsole: () => void;
}

export function HeroExperience({ onOpenSignIn, onExploreConsole }: HeroExperienceProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  // Transition threshold between Page 1 and Page 2
  const isPage2Active = scrollProgress >= 0.48;

  // Opacity calculations for smooth cross-fading
  const page1Opacity = Math.max(0, Math.min(1, (0.45 - scrollProgress) / 0.2));
  const page2Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.48) / 0.25));

  // Terminal editorial headline — stays large on tall screens but is
  // capped by a height-fit formula so the panels always clear the
  // lower-centre CTA band. min() formulas are evaluated by the browser as
  // one calc expression, so no nesting.
  const terminalHeadlineSize =
    "clamp(38px, min(8.5vh, calc((100vh - 552px) / 4.6)), 150px)";

  return (
    <section id="hero" className="relative w-full">
      {/* 230vh total height creates a comfortable, controlled pinning distance */}
      <HeroVideo onProgress={setScrollProgress} className="h-[230vh]">

        {/* ══════════════════════════════════════════════════════════════
            TOP NAVIGATION BAR
            Logo: 144px, left-aligned (mirror of previous right position)
            Nav items: 70px
            ══════════════════════════════════════════════════════════════ */}
        <header
          className="w-full flex items-center justify-between z-30 pointer-events-auto"
          style={{ padding: "32px 64px 0 64px" }}
        >
          {/* DIAL O Logo — left side, same offset from the left edge it previously had from the right */}
          <a
            href="#hero"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            style={{ marginLeft: "0", marginRight: "auto" }}
            aria-label="DIAL O - Home"
          >
            <DialOLogo size="hero" variant="hero" />
          </a>
        </header>

        {/* Navigation — bottom right corner */}
        <nav
          className="absolute top-0 right-0 z-40 pointer-events-auto flex items-center gap-8"
          style={{ padding: "48px 64px 0 0" }}
        >
          <a
            href="#about"
            className="hover:text-[#00FFFF] transition-colors cursor-pointer hidden sm:inline-block font-black uppercase font-modular"
            style={{ fontSize: "24px", letterSpacing: "0.2em", color: "#FFFFFF" }}
          >
            ABOUT
          </a>
          <a
            href="#architecture"
            className="hover:text-[#00FFFF] transition-colors cursor-pointer hidden sm:inline-block font-black uppercase font-modular"
            style={{ fontSize: "24px", letterSpacing: "0.2em", color: "#FFFFFF" }}
          >
            ARCHITECTURE
          </a>
          <span className="text-neutral-600 hidden sm:inline-block" style={{ fontSize: "24px" }}>|</span>
          <button
            onClick={onOpenSignIn}
            className="flex items-center gap-3 hover:text-[#EFCD5E] transition-colors cursor-pointer font-black uppercase font-modular"
            style={{ fontSize: "24px", letterSpacing: "0.2em", color: "#FFFFFF" }}
            aria-label="Sign In"
          >
            <User style={{ width: "24px", height: "24px" }} />
            <span>SIGN IN</span>
          </button>
        </nav>

        {/* ══════════════════════════════════════════════════════════════
            PAGE 1 CONTENT (Active during first ~45% of scroll)
            Left 50%: Empty — Sharp Rotary Dialer video dominates
            Right 50%: Black Terminal — flush to the RIGHT viewport edge
            ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 flex pointer-events-none"
          style={{
            paddingTop: "170px",
            paddingBottom: "200px",
            opacity: page1Opacity,
            visibility: page1Opacity > 0.01 ? "visible" : "hidden",
            pointerEvents: page1Opacity > 0.6 ? "auto" : "none",
          }}
        >
          <div className="w-full h-full grid grid-cols-2 gap-0 items-stretch">
            {/* Left 50%: Empty — rotary dialer video dominates */}
            <div />

            {/* Right 50%: Terminal Panel — major structural half, flush to right edge */}
            <div className="flex items-center">
              <div
                className="w-full bg-black/95 shadow-[0_16px_60px_rgba(0,0,0,0.9)]"
                style={{
                  border: "2px solid #1C1C1C",
                  padding: "40px 48px 48px 48px",
                }}
              >
                {/* Terminal Header — TERMINAL/IGNORE @ 44px */}
                <div
                  className="flex items-center gap-3 border-b border-[#1A1A1A]"
                  style={{ marginBottom: "32px", paddingBottom: "16px" }}
                >
                  <span
                    className="rounded-full bg-[#00FFFF] animate-pulse"
                    style={{ width: "10px", height: "10px", display: "inline-block", flexShrink: 0 }}
                  />
                  <span
                    className="font-black uppercase font-modular"
                    style={{ fontSize: "44px", letterSpacing: "0.15em", color: "#FFFFFF", lineHeight: 1 }}
                  >
                    TERMINAL/IGNORE
                  </span>
                </div>

                {/* Editorial Headline — Hero Statement */}
                <h1
                  className="font-black uppercase font-modular select-none"
                  style={{
                    fontSize: terminalHeadlineSize,
                    lineHeight: 0.92,
                    letterSpacing: "0.04em",
                    margin: 0,
                  }}
                >
                  <span style={{ display: "block", color: "#FFFFFF" }}>EVERY</span>
                  <span style={{ display: "block", color: "#FFFFFF" }}>LEAD</span>
                  <span style={{ display: "block", color: "#FF751F" }}>QUALIFIED</span>
                  <span style={{ display: "block", color: "#FFFFFF" }}>DESERVES</span>
                  <span style={{ display: "block", color: "#EFCD5E" }}>A SHOT</span>
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            EXPLORE CONSOLE CTA — 64px text, horizontally centered at 50% of
            viewport, placed in the LOWER-CENTRE "mouth" of the composition
            ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute left-1/2 z-30 pointer-events-auto"
          style={{
            bottom: "max(40px, 13vh)",
            transform: "translateX(-50%)",
            opacity: page1Opacity,
            visibility: page1Opacity > 0.01 ? "visible" : "hidden",
            pointerEvents: page1Opacity > 0.6 ? "auto" : "none",
          }}
        >
          <button
            onClick={onExploreConsole}
            className="animate-float-subtle font-black uppercase font-modular"
            style={{
              fontSize: "64px",
              letterSpacing: "0.12em",
              lineHeight: 1,
              backgroundColor: "#EFCD5E",
              color: "#000000",
              borderRadius: "9999px",
              padding: "20px 64px",
              border: "2px solid rgba(0,0,0,0.2)",
              boxShadow: "0 6px 32px rgba(239,205,94,0.35)",
              cursor: "pointer",
              transition: "all 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8DA76";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 48px rgba(239,205,94,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EFCD5E";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(239,205,94,0.35)";
            }}
          >
            EXPLORE CONSOLE
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PAGE 2 CONTENT (Active during later ~50% of scroll)
            Left 50%: Black Terminal — flush to the LEFT viewport edge
            Right 50%: Empty — Sharp Telephone Receiver video dominates
            ══════════════════════════════════════════════════════════════ */}
        <div
          id="call-reveal"
          className="absolute inset-0 flex pointer-events-none"
          style={{
            paddingTop: "170px",
            paddingBottom: "140px",
            opacity: page2Opacity,
            visibility: page2Opacity > 0.01 ? "visible" : "hidden",
            pointerEvents: page2Opacity > 0.6 ? "auto" : "none",
          }}
        >
          <div className="w-full h-full grid grid-cols-2 gap-0 items-stretch">
            {/* Left 50%: Terminal Panel — major structural half, flush to left edge */}
            <div className="flex items-center">
              <div
                className="w-full bg-black/95 shadow-[0_16px_60px_rgba(0,0,0,0.9)]"
                style={{
                  border: "2px solid #1C1C1C",
                  padding: "40px 48px 48px 48px",
                }}
              >
                {/* Terminal Header — TERMINAL/IGNORE @ 44px */}
                <div
                  className="flex items-center gap-3 border-b border-[#1A1A1A]"
                  style={{ marginBottom: "32px", paddingBottom: "16px" }}
                >
                  <span
                    className="rounded-full bg-[#FF751F] animate-pulse"
                    style={{ width: "10px", height: "10px", display: "inline-block", flexShrink: 0 }}
                  />
                  <span
                    className="font-black uppercase font-modular"
                    style={{ fontSize: "44px", letterSpacing: "0.15em", color: "#FFFFFF", lineHeight: 1 }}
                  >
                    TERMINAL/IGNORE
                  </span>
                </div>

                {/* Statement Text */}
                <div
                  className="font-black uppercase font-modular select-none"
                  style={{
                    fontSize: terminalHeadlineSize,
                    lineHeight: 0.92,
                    letterSpacing: "0.04em",
                  }}
                >
                  <div style={{ color: "#FFFFFF" }}>SO WE</div>
                  <div className="relative" style={{ display: "inline-block", marginTop: "4px", color: "#FFFFFF" }}>
                    {/* Double strike / geometric horizontal accent */}
                    <span className="relative z-10">CALL THEM</span>
                    <span
                      className="absolute z-0"
                      style={{
                        left: 0,
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: "4px",
                        backgroundColor: "rgba(0,255,255,0.8)",
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div style={{ color: "#FFFFFF", display: "block" }}>FOR YOU</div>
                </div>
              </div>
            </div>

            {/* Right 50%: Empty — telephone receiver video dominates */}
            <div />
          </div>
        </div>

        {/* Scroll indicator prompt at the bottom of hero */}
        <div className="w-full pb-6 flex items-center justify-center pointer-events-none z-30 absolute bottom-0 left-0">
          <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <span
              className="uppercase font-modular font-bold"
              style={{ fontSize: "11px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.7)" }}
            >
              {scrollProgress < 0.4 ? "SCROLL DOWN TO PROGRESS CAMERA" : "CONTINUE SCROLLING TO SYSTEM WALKTHROUGH"}
            </span>
            <div className="w-[1px] h-6 bg-gradient-to-b from-[#00FFFF] to-transparent animate-pulse" />
          </div>
        </div>
      </HeroVideo>
    </section>
  );
}
