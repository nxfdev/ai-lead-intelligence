"use client";

import React, { useState } from "react";
import { Sparkles, ChevronRight, Menu, X, Bot, ShieldCheck, Flame } from "lucide-react";

interface AladdinNavbarProps {
  onOpenGenie?: () => void;
  onNavigateSection?: (section: string) => void;
}

export function AladdinNavbar({ onOpenGenie, onNavigateSection }: AladdinNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");

  const navItems = [
    { label: "Home", id: "hero" },
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Pricing", id: "pricing" },
    { label: "About", id: "about" },
  ];

  const handleNavClick = (label: string, id: string) => {
    setActiveTab(label);
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between rounded-full px-6 py-2.5 bg-[#070c24]/75 backdrop-blur-2xl border border-amber-400/25 shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick("Home", "hero")}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          {/* Ornate Mini Golden Lamp Icon */}
          <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-500/20 to-cyan-500/10 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.5 9c-.5 0-.9.2-1.2.5L16 11.2V8c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1v1.3L4.8 8.6C4.1 8.2 3.2 8.5 2.8 9.2c-.4.7-.1 1.6.6 2l3.6 2.1c.1.7.5 1.3 1.1 1.7L7 17.5c-.2.6.2 1.2.8 1.4.6.2 1.2-.2 1.4-.8l1-2.6c1.1.3 2.3.3 3.4 0l1 2.6c.2.6.8 1 1.4.8.6-.2 1-.8.8-1.4l-1.1-2.5c.6-.4 1-.9 1.1-1.7l3.6-2.1c.7-.4 1-1.3.6-2-.3-.6-.9-.8-1.5-.7z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide gold-shimmer-text">
              AladdinAI
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.label, item.id)}
              className={`text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === item.label
                  ? "text-amber-300 font-semibold drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  : "text-slate-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right CTA & Genie summon button */}
        <div className="flex items-center gap-3">
          {/* Live Agent Pill */}
          <button
            onClick={onOpenGenie}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            title="Summon Aladdin AI Assistant"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Genie Ready</span>
          </button>

          {/* Golden Pill CTA */}
          <button
            onClick={onOpenGenie}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-amber-400/60 text-amber-300 hover:text-amber-100 bg-amber-500/10 hover:bg-gradient-to-r hover:from-amber-500/30 hover:to-amber-600/30 text-xs sm:text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] cursor-pointer"
          >
            <span>Get Started</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-sm rounded-2xl bg-[#080d2a]/95 backdrop-blur-2xl border border-amber-400/30 p-4 shadow-2xl flex flex-col gap-3">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.label, item.id)}
              className="text-left text-sm py-2 px-3 rounded-lg text-slate-200 hover:bg-amber-400/10 hover:text-amber-300 transition"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenGenie) onOpenGenie();
            }}
            className="w-full mt-2 py-2 rounded-xl btn-aladdin-primary text-sm font-bold text-slate-950 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Rub The Lamp (Open Genie)</span>
          </button>
        </div>
      )}
    </header>
  );
}
