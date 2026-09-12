"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  Play,
  CheckCircle2,
  Phone,
  Search,
  Calendar,
  Volume2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGenie: () => void;
}

export function DemoModal({ isOpen, onClose, onOpenGenie }: DemoModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "1. The Lamp Awakens — Criteria Discovery",
      desc: "Aladdin AI reads your target market requirements, city radius, and buyer pain points to build the qualification profile.",
      badge: "Discovery Engine",
      color: "from-amber-500/30 to-amber-600/10 border-amber-400/50 text-amber-300",
      highlight: "Scraping 50+ local HVAC & Tech contractors in Texas...",
    },
    {
      title: "2. Autonomous Evidence Scoring",
      desc: "Each company is cross-referenced with Google Reviews, website signals, and hiring posts to formulate an evidence-based qualification score.",
      badge: "AI Scoring Matrix",
      color: "from-cyan-500/30 to-cyan-600/10 border-cyan-400/50 text-cyan-300",
      highlight: "Sarah Johnson (BrightTech Solutions) scored 94/100 (High Buying Intent)",
    },
    {
      title: "3. CALL-E Voice Agent Dialing",
      desc: "The autonomous voice agent dials the decision-maker, navigates gatekeepers, answers objections, and verifies budget in under 4 minutes.",
      badge: "Voice Synthesizer",
      color: "from-purple-500/30 to-purple-600/10 border-purple-400/50 text-purple-300",
      highlight: "'Hello Sarah, this is the AI assistant calling regarding after-hours dispatch...'",
    },
    {
      title: "4. Meeting Booked Like Magic!",
      desc: "Prospect agrees to a live demo. The calendar invitation is dispatched instantly and synced with your CRM.",
      badge: "Calendar Magic",
      color: "from-emerald-500/30 to-emerald-600/10 border-emerald-400/50 text-emerald-300",
      highlight: "Meeting Scheduled for Thursday 2:00 PM • Synced to Google Calendar",
    },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-aladdin border border-amber-400/40 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-cyan-500/20 to-purple-500/30 border border-amber-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin-slow" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Interactive Simulation
            </span>
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
              How Aladdin AI Works Like Magic
            </h3>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                step === idx
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                  : idx < step
                  ? "bg-amber-400/50"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Active Stage Display */}
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${steps[step].color} border mb-6 transition-all duration-500`}>
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20">
              {steps[step].badge}
            </span>
            <span className="text-xs font-semibold opacity-70">
              Step {step + 1} of 4
            </span>
          </div>

          <h4 className="font-cinzel text-lg sm:text-xl font-bold text-white mb-2">
            {steps[step].title}
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed mb-4">
            {steps[step].desc}
          </p>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <p className="text-xs sm:text-sm font-mono text-emerald-300">
              {steps[step].highlight}
            </p>
          </div>
        </div>

        {/* Modal CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setStep((prev) => (prev + 1) % steps.length)}
            className="px-5 py-2.5 rounded-xl btn-aladdin-secondary text-xs sm:text-sm font-semibold flex items-center gap-2"
          >
            <span>Next Stage</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenGenie();
            }}
            className="px-6 py-2.5 rounded-xl btn-aladdin-primary text-xs sm:text-sm font-bold text-slate-950 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try It Live with Aladdin Lamp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
