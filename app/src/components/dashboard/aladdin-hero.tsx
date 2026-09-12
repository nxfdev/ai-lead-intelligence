"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, ChevronRight, Play, CheckCircle2 } from "lucide-react";

interface AladdinHeroProps {
  onOpenGenie: () => void;
  onOpenDemo: () => void;
  onTaskCreated?: (taskId: string) => void;
  onTriggerCall?: (leadId: string) => void;
}

export function AladdinHero({
  onOpenGenie,
  onOpenDemo,
}: AladdinHeroProps) {
  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center overflow-hidden"
    >
      {/* ── Will Smith Genie Background ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/will-smith-aladdin-bg.jpg"
          alt="Aladdin AI Background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#04020a]/95 via-[#06030f]/80 to-[#04020a]/60" />
        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#04020a] to-transparent" />
        {/* Subtle golden shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#04020a]/30" />
      </div>

      {/* Floating orbs for atmosphere */}
      <div className="absolute top-20 right-1/3 w-64 h-64 rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)", filter: "blur(40px)" }}
      />
      <div className="absolute bottom-32 left-1/4 w-80 h-80 rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)", filter: "blur(50px)" }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-4 sm:px-8 pt-24 pb-16">

        {/* Left Column: Hero Typography & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start">

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold tracking-wide mb-6"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.4)",
              color: "#fde68a",
              boxShadow: "0 0 20px rgba(245,158,11,0.2)",
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>Your AI Lead Generation & Calling Agent</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-cinzel text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
            Find Leads.
            <br />
            Make Calls.
            <br />
            <span className="gold-shimmer-text">Work Like Magic.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            AladdinAI is your 24/7 AI agent that finds high-quality leads, makes calls, and books
            meetings — so you can focus on what really matters.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onOpenGenie}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base tracking-wide cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                color: "#1a0a00",
                boxShadow: "0 10px 30px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.3)",
              }}
            >
              <span>Rub the Lamp</span>
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDemo}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-sm sm:text-base font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                color: "#e2e8f0",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300 ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real Autonomous Calls</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Verified Decision Makers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Instant CRM Sync</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Lamp */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[400px] lg:min-h-[480px]">
          {/* Ethereal Glow */}
          <div className="absolute w-72 h-72 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(245,158,11,0.25) 40%, transparent 70%)",
              filter: "blur(40px)",
              animation: "pulse 3s ease-in-out infinite",
            }}
          />

          {/* Clickable Lamp */}
          <button
            onClick={onOpenGenie}
            className="group relative cursor-pointer select-none flex flex-col items-center justify-center p-4 transition-transform duration-500 hover:scale-108 active:scale-95 focus:outline-none"
            title="Rub the Lamp to Summon Aladdin AI Genie"
          >
            {/* Animated Cyan Smoke Stream */}
            <div className="absolute -top-16 left-10 pointer-events-none w-36 h-24 overflow-visible z-20">
              <svg className="w-full h-full" viewBox="0 0 100 80" fill="none">
                <path
                  d="M15 75 C 25 50, 45 60, 50 35 C 55 10, 80 20, 85 5"
                  stroke="url(#hero-smoke-live)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="smoke-stream-anim"
                />
                <path
                  d="M18 78 C 30 55, 38 65, 42 40 C 46 15, 68 25, 75 8"
                  stroke="url(#hero-smoke-gold)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="smoke-stream-anim"
                  style={{ animationDelay: "1.5s" }}
                />
                <defs>
                  <linearGradient id="hero-smoke-live" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                    <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="hero-smoke-gold" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#c084fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Floating Invite Badge */}
            <div className="mb-3 whitespace-nowrap px-4 py-1.5 rounded-full border text-amber-200 text-xs font-bold flex items-center gap-2 backdrop-blur-xl group-hover:border-cyan-400 group-hover:text-cyan-200 transition animate-pulse"
              style={{
                background: "rgba(8,13,40,0.9)",
                border: "1px solid rgba(245,158,11,0.6)",
                boxShadow: "0 5px 25px rgba(0,0,0,0.7), 0 0 25px rgba(245,158,11,0.4)",
              }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Rub the Lamp · Summon the Genie</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>

            {/* The 3D Golden Lamp */}
            <div
              className="relative w-52 h-52 sm:w-64 sm:h-64 animate-lamp-float transition-all duration-500"
              style={{
                filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.85)) drop-shadow(0 0 45px rgba(245,158,11,0.9)) drop-shadow(0 0 65px rgba(6,182,212,0.7))",
              }}
            >
              <Image
                src="/aladdin-lamp-3d-isolated.png"
                alt="Aladdin 3D Golden Magic Lamp"
                width={320}
                height={320}
                className="w-full h-full object-contain pointer-events-none"
                priority
              />

              {/* Sparkle Points */}
              <div className="absolute top-6 left-12 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
              <div className="absolute top-10 right-14 w-2 h-2 rounded-full bg-amber-300 animate-ping delay-300" />
            </div>

            {/* Scroll hint */}
            <p className="mt-4 text-xs text-slate-400/70 animate-bounce">↓ Scroll to explore</p>
          </button>
        </div>
      </div>
    </section>
  );
}
