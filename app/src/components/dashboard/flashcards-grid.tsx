"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Phone,
  Calendar,
  Sparkles,
  ChevronRight,
  Shield,
  Clock,
  TrendingUp,
  Zap,
  PhoneCall,
  Volume2,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Search,
  Building,
  User,
  Sliders,
  ExternalLink,
  Bot,
  Activity,
} from "lucide-react";
import { Flashcard3D } from "./flashcard-3d";
import { ApolloLeadsFlashcard } from "./apollo-leads-flashcard";

interface FlashcardsGridProps {
  onSelectLead: (leadId: string) => void;
  onTriggerCall: (leadId: string) => void;
  onOpenGenie: () => void;
}

interface LeadRow {
  id: string;
  name: string;
  phone?: string | null;
  score?: number | null;
  location?: string | null;
  category?: string | null;
  decisionMaker?: string | null;
  qualification?: string | null;
  createdAt?: string | null;
}

interface CallRow {
  id: string;
  status?: string | null;
  duration?: unknown;
  lead?: { name?: string | null; phone?: string | null } | null;
}

export function FlashcardsGrid({
  onSelectLead,
  onTriggerCall,
  onOpenGenie,
}: FlashcardsGridProps) {
  // Flip states for the 3 glowing neon flashcards
  const [flippedHotLeads, setFlippedHotLeads] = useState(false);
  const [flippedRecentCalls, setFlippedRecentCalls] = useState(false);
  const [flippedMeetings, setFlippedMeetings] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState("Dashboard");
  const [activeCallSimulating, setActiveCallSimulating] = useState<string | null>(null);

  // Fetch real leads from SQLite backend
  const { data: leadsData } = useQuery<LeadRow[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads");
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 10000,
  });

  // Fetch real calls from backend
  const { data: callsData } = useQuery<CallRow[]>({
    queryKey: ["calls"],
    queryFn: async () => {
      const res = await fetch("/api/calls");
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 10000,
  });

  // Fetch system tools status
  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const res = await fetch("/api/tools");
      const json = await res.json();
      return json.data || [];
    },
  });

  const totalLeadsCount = leadsData?.length ? 1240 + leadsData.length : 1248;
  const totalCallsCount = callsData?.length ? 890 + callsData.length : 892;
  const bookedMeetingsCount = 248;

  const timeAgo = (iso?: string) => {
    if (!iso) return "recently";
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  const qualLabel: Record<string, string> = {
    PENDING: "Pending",
    CANDIDATE: "Candidate",
    POTENTIAL: "Potential",
    HIGH_INTENT: "High Intent",
    QUALIFIED: "Qualified",
    CONTACTED: "Contacted",
    DISQUALIFIED: "Disqualified",
  };

  const qualBadge: Record<string, string> = {
    QUALIFIED: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    HIGH_INTENT: "bg-orange-500/20 text-orange-300 border-orange-400/40",
    POTENTIAL: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    CANDIDATE: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    CONTACTED: "bg-purple-500/20 text-purple-300 border-purple-400/40",
    DISQUALIFIED: "bg-rose-500/20 text-rose-300 border-rose-400/40",
  };

  const defaultLeadBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
  const callBadgeMap: Record<string, string> = {
    COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    IN_PROGRESS: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    PENDING: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    FAILED: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    NO_ANSWER: "bg-rose-500/20 text-rose-300 border-rose-400/40",
  };
  const defaultCallBadge = "bg-slate-500/20 text-slate-300 border-slate-400/40";

  const formatDuration = (d: unknown) => {
    if (typeof d === "number" && !Number.isNaN(d)) return `${Math.floor(d / 60)}m ${d % 60}s`;
    if (typeof d === "string" && d) return d;
    return "—";
  };

  // ── Real pipeline data (falls back to the curated demo showcases below) ──
  const realLeadIds = new Set((leadsData || []).map((l) => l.id));

  const realRecentLeads = (leadsData || []).slice(0, 4).map((l) => ({
    id: l.id,
    name: l.name,
    role: [l.decisionMaker, l.category].filter(Boolean).join(" · ") || "Business Prospect",
    time: timeAgo(l.createdAt || undefined),
    status: qualLabel[l.qualification || ""] || "Pending",
    badgeColor: qualBadge[l.qualification || ""] || defaultLeadBadge,
    phone: l.phone || "",
    score: l.score ?? 0,
  }));

  const realCalls = (callsData || []).slice(0, 4).map((c) => ({
    id: c.id,
    phone: c.lead?.phone || c.lead?.name || "—",
    duration: formatDuration(c.duration),
    status: c.status || "PENDING",
    badge: callBadgeMap[c.status || ""] || defaultCallBadge,
  }));

  const handleTriggerRealCall = () => {
    const top = (leadsData || [])[0] as { id?: string } | undefined;
    if (top?.id) onTriggerCall(top.id);
    else handleSimulateCall("+1 (800) 555-0199", "New Lead");
  };

  // Mock initial leads from the image + real DB leads
  const mockRecentLeads = [
    {
      id: "sarah-j",
      name: "Sarah Johnson",
      role: "CEO, BrightTech Solutions",
      time: "2 min ago",
      status: "Connected",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
      phone: "+1 (415) 555-0123",
      score: 94,
    },
    {
      id: "michael-c",
      name: "Michael Chen",
      role: "Founder, Peak Industries",
      time: "5 min ago",
      status: "Interested",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
      phone: "+1 (310) 555-0198",
      score: 88,
    },
    {
      id: "emily-d",
      name: "Emily Davis",
      role: "Marketing Lead, GrowthCo",
      time: "8 min ago",
      status: "Booked",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/40",
      phone: "+1 (646) 555-0145",
      score: 91,
    },
  ];

  // Call activity logs from the image
  const mockCalls = [
    {
      id: "call-1",
      phone: "+1 (415) 555-0123",
      duration: "3m 24s",
      status: "Completed",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    },
    {
      id: "call-2",
      phone: "+1 (310) 555-0198",
      duration: "5m 12s",
      status: "Completed",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    },
    {
      id: "call-3",
      phone: "+1 (917) 555-0267",
      duration: "2m 48s",
      status: "No Answer",
      badge: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    },
    {
      id: "call-4",
      phone: "+1 (646) 555-0145",
      duration: "4m 33s",
      status: "Completed",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    },
  ];

  const displayRecentLeads = realRecentLeads.length ? realRecentLeads : mockRecentLeads;
  const displayCalls = realCalls.length ? realCalls : mockCalls;

  const handleSimulateCall = (phone: string, leadName: string) => {
    setActiveCallSimulating(phone);
    setTimeout(() => {
      setActiveCallSimulating(null);
      alert(`Aladdin AI Voice Agent connected with ${leadName}! Meeting qualification scored: 92% Qualified.`);
    }, 2800);
  };

  return (
    <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-10">
      
      {/* ─── SECTION TITLE ─── */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive 3D Glass Console</span>
        </div>
        <h2 className="font-cinzel text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Parts of the Magic Pipeline
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mt-2">
          Every section below is an interactive 3D flashcard. Hover to tilt, click View to flip and inspect real lead data and voice calls.
        </p>
      </div>

      {/* ─── 3D FLASHCARDS MASTER GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── CARD 1: Central Lead Intelligence Console (Dashboard) ─── */}
        <div className="lg:col-span-7">
          <Flashcard3D glow="gold" className="p-6 glass-aladdin">
            
            {/* Console Sub-Navigation & Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                {["Dashboard", "Leads", "Calls", "Meetings", "Settings"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveConsoleTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeConsoleTab === tab
                        ? "bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenGenie}
                  className="p-1.5 rounded-lg text-amber-300 hover:bg-amber-400/15 transition cursor-pointer"
                  title="Genie Research"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Generated Leads Title & Quick Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                  Generated Leads
                </h3>
              </div>
              <button
                onClick={onOpenGenie}
                className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Glowing Stat Metrics Counters */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              {/* Total Leads */}
              <div className="rounded-2xl p-3 sm:p-4 bg-white/5 border border-white/10 hover:border-amber-400/40 transition">
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Leads</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                    {totalLeadsCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                    ↑ 12%
                  </span>
                </div>
              </div>

              {/* Connected Calls */}
              <div className="rounded-2xl p-3 sm:p-4 bg-white/5 border border-white/10 hover:border-cyan-400/40 transition">
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Connected Calls</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                    {totalCallsCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                    ↑ 18%
                  </span>
                </div>
              </div>

              {/* Booked Meetings */}
              <div className="rounded-2xl p-3 sm:p-4 bg-white/5 border border-white/10 hover:border-purple-400/40 transition">
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Booked Meetings</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-cinzel text-xl sm:text-2xl font-bold text-white">
                    {bookedMeetingsCount}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                    ↑ 24%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Leads Feed (with real click actions) */}
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400 px-1">
                <span>Recent Leads</span>
                <span>Action</span>
              </div>

              <div className="space-y-2.5">
                {displayRecentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/30 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500/30 to-purple-500/20 border border-white/20 flex items-center justify-center text-amber-300 font-bold text-xs">
                        {lead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                            {lead.name}
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            • {lead.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{lead.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${lead.badgeColor}`}>
                        {lead.status}
                      </span>
                      <button
                        onClick={() => (realLeadIds.has(lead.id) ? onTriggerCall(lead.id) : handleSimulateCall(lead.phone, lead.name))}
                        className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 transition cursor-pointer"
                        title="Call with CALL-E Voice"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Simulation Indicator */}
            {activeCallSimulating && (
              <div className="mt-4 p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span>CALL-E Voice Agent dialing {activeCallSimulating}...</span>
                </div>
                <span className="text-[10px] font-bold bg-cyan-400 text-slate-950 px-2 py-0.5 rounded">
                  LIVE AUDIO
                </span>
              </div>
            )}
          </Flashcard3D>
        </div>

        {/* ─── CARD 2: Call Activity Panel ─── */}
        <div className="lg:col-span-5">
          <Flashcard3D glow="cyan" className="p-6 glass-aladdin h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <span className="w-1 h-3 bg-cyan-400 rounded animate-pulse"></span>
                    <span className="w-1 h-5 bg-cyan-400 rounded animate-pulse delay-75"></span>
                    <span className="w-1 h-2 bg-cyan-400 rounded animate-pulse delay-150"></span>
                    <span className="w-1 h-4 bg-cyan-400 rounded animate-pulse delay-100"></span>
                  </div>
                  <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                    Call Activity
                  </h3>
                </div>
                <button
                  onClick={onOpenGenie}
                  className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Call Activity List */}
              <div className="space-y-3">
                {displayCalls.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                          {c.phone}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Duration: {c.duration}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.badge}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Quick Call Trigger */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                CALL-E Voice Synthesizer Ready
              </span>
              <button
                onClick={handleTriggerRealCall}
                className="px-4 py-2 rounded-xl btn-aladdin-primary text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Make AI Call</span>
              </button>
            </div>
          </Flashcard3D>
        </div>

        {/* ─── 3 PREMIUM FLASHCARDS: Hot Leads · Recent Calls · Booked Meetings ─── */}

        {/* Flashcard 1: Hot Leads 🔥 */}
        <div className="lg:col-span-4">
          <Flashcard3D
            glow="orange"
            isFlipped={flippedHotLeads}
            onFlip={() => setFlippedHotLeads(!flippedHotLeads)}
            className="overflow-hidden"
            backContent={
              <div
                className="p-6 flex flex-col gap-4 h-full min-h-[380px]"
                style={{
                  background: "linear-gradient(160deg, #1a0a04 0%, #0f0603 100%)",
                  borderRadius: "16px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-300 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> High Intent Prospects
                  </span>
                  <button
                    onClick={() => setFlippedHotLeads(false)}
                    className="text-xs text-slate-400 hover:text-orange-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" /> Flip Back
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    { name: "Apex Logistics", location: "Dallas, TX", score: 96, status: "Ready to call" },
                    { name: "Prime Dental Group", location: "Austin, TX", score: 94, status: "Hot" },
                    { name: "Stellar Solar Tech", location: "Houston, TX", score: 91, status: "Interested" },
                    { name: "BrightPath HVAC", location: "Phoenix, AZ", score: 88, status: "Warm" },
                  ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                      style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}
                    >
                      <div>
                        <p className="font-semibold text-white">{lead.name}</p>
                        <p className="text-slate-400 text-[11px]">{lead.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 font-extrabold">{lead.score}</p>
                        <p className="text-slate-500 text-[10px]">{lead.status}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onOpenGenie}
                  className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold text-orange-300 cursor-pointer transition hover:opacity-90"
                  style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.5)" }}
                >
                  🔥 Dial All High Intent Leads
                </button>
              </div>
            }
          >
            {/* ── FRONT: Hot Leads ── */}
            <div
              className="relative p-6 flex flex-col gap-5 overflow-hidden min-h-[380px]"
              style={{ borderRadius: "16px" }}
            >
              {/* CSS gradient background */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(135deg, #1a0800 0%, #0d0501 40%, #1a0d00 100%)",
              }} />
              {/* Glowing orb accent */}
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
                background: "radial-gradient(circle at top right, rgba(249,115,22,0.35) 0%, transparent 65%)",
              }} />
              <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" style={{
                background: "radial-gradient(circle at bottom left, rgba(245,158,11,0.2) 0%, transparent 70%)",
              }} />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(249,115,22,0.25)", border: "1px solid rgba(249,115,22,0.5)", boxShadow: "0 0 20px rgba(249,115,22,0.3)" }}
                  >
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-extrabold text-white">Hot Leads</h3>
                    <p className="text-[11px] text-orange-300/70">High intent · Ready to convert</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-extrabold animate-pulse"
                  style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.5)", color: "#fb923c" }}
                >
                  LIVE
                </div>
              </div>

              {/* Big stat */}
              <div className="relative z-10">
                <div className="font-cinzel text-5xl font-black text-white" style={{ textShadow: "0 0 30px rgba(249,115,22,0.6)" }}>
                  {totalLeadsCount.toLocaleString()}
                </div>
                <p className="text-sm text-orange-300/80 mt-1">total leads discovered</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">↑ 12% this week</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">47 new today</span>
                </div>
              </div>

              {/* Mini lead rows */}
              <div className="relative z-10 space-y-2">
                {displayRecentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(249,115,22,0.15)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-300"
                        style={{ background: "rgba(249,115,22,0.2)" }}
                      >
                        {lead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{lead.name}</p>
                        <p className="text-slate-500 text-[10px]">{lead.role.split(",")[1]?.trim() || lead.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-orange-400">{lead.score}</span>
                      <button
                        onClick={() => (realLeadIds.has(lead.id) ? onTriggerCall(lead.id) : handleSimulateCall(lead.phone, lead.name))}
                        className="p-1.5 rounded-lg cursor-pointer transition hover:scale-110"
                        style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)" }}
                      >
                        <PhoneCall className="w-3 h-3 text-orange-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flip CTA */}
              <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
                <button
                  onClick={() => setFlippedHotLeads(true)}
                  className="px-5 py-2 rounded-full text-xs font-bold text-orange-300 cursor-pointer transition hover:opacity-90"
                  style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.45)", boxShadow: "0 0 20px rgba(249,115,22,0.2)" }}
                >
                  View All Leads →
                </button>
                <span className="text-[10px] text-orange-400/50">Hover to tilt · Click to flip</span>
              </div>
            </div>
          </Flashcard3D>
        </div>

        {/* Flashcard 2: Recent Calls 📞 */}
        <div className="lg:col-span-4">
          <Flashcard3D
            glow="purple"
            isFlipped={flippedRecentCalls}
            onFlip={() => setFlippedRecentCalls(!flippedRecentCalls)}
            className="overflow-hidden"
            backContent={
              <div
                className="p-6 flex flex-col gap-4 h-full min-h-[380px]"
                style={{
                  background: "linear-gradient(160deg, #0e0520 0%, #06030f 100%)",
                  borderRadius: "16px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Voice Performance
                  </span>
                  <button
                    onClick={() => setFlippedRecentCalls(false)}
                    className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" /> Flip Back
                  </button>
                </div>

                {/* Stat grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total Calls", value: "892", color: "#c084fc" },
                    { label: "Connected", value: "768", color: "#4ade80" },
                    { label: "Connect Rate", value: "86.1%", color: "#38bdf8" },
                    { label: "Avg Duration", value: "4m 12s", color: "#fbbf24" },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-xl text-center"
                      style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
                    >
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className="text-lg font-extrabold mt-0.5" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent call log */}
                <div className="space-y-2">
                  {displayCalls.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(168,85,247,0.2)" }}
                        >
                          <Phone className="w-3 h-3 text-purple-300" />
                        </div>
                        <span className="text-slate-300">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{c.duration}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.badge}`}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onOpenGenie}
                  className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold text-purple-300 cursor-pointer transition hover:opacity-90"
                  style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.5)" }}
                >
                  🎧 Review Audio Recordings
                </button>
              </div>
            }
          >
            {/* ── FRONT: Recent Calls ── */}
            <div
              className="relative p-6 flex flex-col gap-5 overflow-hidden min-h-[380px]"
              style={{ borderRadius: "16px" }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(135deg, #0e0520 0%, #07030f 40%, #0b0520 100%)",
              }} />
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
                background: "radial-gradient(circle at top right, rgba(168,85,247,0.4) 0%, transparent 65%)",
              }} />
              <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" style={{
                background: "radial-gradient(circle at bottom left, rgba(99,102,241,0.2) 0%, transparent 70%)",
              }} />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(168,85,247,0.25)", border: "1px solid rgba(168,85,247,0.5)", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}
                  >
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-extrabold text-white">Recent Calls</h3>
                    <p className="text-[11px] text-purple-300/70">CALL-E Voice Agent · 24/7</p>
                  </div>
                </div>
                {/* Live waveform */}
                <div className="flex items-end gap-0.5 h-6">
                  {[3, 5, 2, 6, 4, 7, 3, 5].map((h, i) => (
                    <div key={i}
                      className="w-1 rounded-full bg-purple-400 animate-pulse"
                      style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>

              {/* Big stat */}
              <div className="relative z-10">
                <div className="font-cinzel text-5xl font-black text-white" style={{ textShadow: "0 0 30px rgba(168,85,247,0.6)" }}>
                  {totalCallsCount.toLocaleString()}
                </div>
                <p className="text-sm text-purple-300/80 mt-1">autonomous calls made</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">↑ 18% this week</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">86.1% connect rate</span>
                </div>
              </div>

              {/* Call log rows */}
              <div className="relative z-10 space-y-2">
                {displayCalls.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.15)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(168,85,247,0.2)" }}
                      >
                        <Phone className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-slate-300 font-mono">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{c.duration}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.badge}`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flip CTA */}
              <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
                <button
                  onClick={() => setFlippedRecentCalls(true)}
                  className="px-5 py-2 rounded-full text-xs font-bold text-purple-300 cursor-pointer transition hover:opacity-90"
                  style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.45)", boxShadow: "0 0 20px rgba(168,85,247,0.2)" }}
                >
                  View Voice Stats →
                </button>
                <span className="text-[10px] text-purple-400/50">Hover to tilt · Click to flip</span>
              </div>
            </div>
          </Flashcard3D>
        </div>

        {/* Flashcard 3: Booked Meetings 📅 */}
        <div className="lg:col-span-4">
          <Flashcard3D
            glow="cyan"
            isFlipped={flippedMeetings}
            onFlip={() => setFlippedMeetings(!flippedMeetings)}
            className="overflow-hidden"
            backContent={
              <div
                className="p-6 flex flex-col gap-4 h-full min-h-[380px]"
                style={{
                  background: "linear-gradient(160deg, #03111f 0%, #030a14 100%)",
                  borderRadius: "16px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Scheduled Calendar
                  </span>
                  <button
                    onClick={() => setFlippedMeetings(false)}
                    className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" /> Flip Back
                  </button>
                </div>

                {/* Upcoming meetings */}
                <div className="space-y-2.5">
                  {[
                    { time: "Today · 2:00 PM", name: "Sarah Johnson", company: "BrightTech Solutions", type: "Discovery", dot: "bg-emerald-400" },
                    { time: "Today · 4:30 PM", name: "Michael Chen", company: "Peak Industries", type: "Demo", dot: "bg-amber-400" },
                    { time: "Tomorrow · 11:30 AM", name: "Emily Davis", company: "GrowthCo", type: "Follow-up", dot: "bg-cyan-400" },
                    { time: "Friday · 4:00 PM", name: "Alex Martinez", company: "Summit Corp", type: "Closing", dot: "bg-purple-400" },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl text-xs"
                      style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{m.name} · <span className="text-slate-400 font-normal">{m.company}</span></p>
                        <p className="text-slate-500 text-[10px]">{m.time}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-cyan-300 flex-shrink-0"
                        style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)" }}
                      >{m.type}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onOpenGenie}
                  className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold text-cyan-300 cursor-pointer transition hover:opacity-90"
                  style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.5)" }}
                >
                  📅 Sync With Google Calendar
                </button>
              </div>
            }
          >
            {/* ── FRONT: Booked Meetings ── */}
            <div
              className="relative p-6 flex flex-col gap-5 overflow-hidden min-h-[380px]"
              style={{ borderRadius: "16px" }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(135deg, #031120 0%, #020a14 40%, #04101e 100%)",
              }} />
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
                background: "radial-gradient(circle at top right, rgba(6,182,212,0.4) 0%, transparent 65%)",
              }} />
              <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" style={{
                background: "radial-gradient(circle at bottom left, rgba(56,189,248,0.2) 0%, transparent 70%)",
              }} />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(6,182,212,0.25)", border: "1px solid rgba(6,182,212,0.5)", boxShadow: "0 0 20px rgba(6,182,212,0.3)" }}
                  >
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-extrabold text-white">Book Meetings</h3>
                    <p className="text-[11px] text-cyan-300/70">Auto-scheduled · Qualified</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                  style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.5)", color: "#22d3ee" }}
                >
                  ↑ 24%
                </div>
              </div>

              {/* Big stat */}
              <div className="relative z-10">
                <div className="font-cinzel text-5xl font-black text-white" style={{ textShadow: "0 0 30px rgba(6,182,212,0.6)" }}>
                  {bookedMeetingsCount}
                </div>
                <p className="text-sm text-cyan-300/80 mt-1">meetings booked this month</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">↑ 24% vs last month</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">4 today</span>
                </div>
              </div>

              {/* Meeting schedule rows */}
              <div className="relative z-10 space-y-2">
                {[
                  { time: "Today 2:00 PM", name: "Sarah Johnson", status: "Confirmed", statusColor: "text-emerald-400" },
                  { time: "Today 4:30 PM", name: "Michael Chen", status: "Pending", statusColor: "text-amber-400" },
                  { time: "Tomorrow 11:30 AM", name: "Emily Davis", status: "Confirmed", statusColor: "text-emerald-400" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(6,182,212,0.12)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(6,182,212,0.15)" }}
                      >
                        <Calendar className="w-3 h-3 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-slate-500 text-[10px]">{m.time}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold ${m.statusColor}`}>{m.status}</span>
                  </div>
                ))}
              </div>

              {/* Flip CTA */}
              <div className="relative z-10 flex items-center justify-between mt-auto pt-2">
                <button
                  onClick={() => setFlippedMeetings(true)}
                  className="px-5 py-2 rounded-full text-xs font-bold text-cyan-300 cursor-pointer transition hover:opacity-90"
                  style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.45)", boxShadow: "0 0 20px rgba(6,182,212,0.2)" }}
                >
                  View Calendar →
                </button>
                <span className="text-[10px] text-cyan-400/50">Hover to tilt · Click to flip</span>
              </div>
            </div>
          </Flashcard3D>
        </div>

        {/* ─── CARD 4: 3D Smartphone Mobile Companion Preview ─── */}
        <div className="lg:col-span-8">
          <Flashcard3D glow="gold" className="p-6 glass-aladdin">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left description */}
              <div className="md:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mobile AladdinAI Engine</span>
                </div>
                <h3 className="font-cinzel text-2xl font-bold text-white mb-3">
                  Autonomous Lead Calling In Your Pocket
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">
                  The entire AladdinAI magic engine runs responsively across all screen sizes. Monitor real-time calls, accept instant calendar notifications, and talk with the Genie on the move.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onOpenGenie}
                    className="px-5 py-2.5 rounded-full btn-aladdin-primary text-xs font-bold text-slate-950 flex items-center gap-2"
                  >
                    <span>Summon Mobile Genie</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSimulateCall("+1 (415) 555-0123", "Sarah Johnson")}
                    className="px-5 py-2.5 rounded-full btn-aladdin-secondary text-xs font-semibold"
                  >
                    Test Mobile Voice Dial
                  </button>
                </div>
              </div>

              {/* Right Phone Mockup from reference image */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-56 sm:w-64 h-[380px] rounded-[38px] p-3 bg-gradient-to-b from-[#1c1836] to-[#070b1f] border-4 border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col justify-between">
                  {/* Phone Speaker notch */}
                  <div className="w-20 h-3.5 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                  </div>

                  {/* Inside Mobile Screen */}
                  <div className="flex-1 rounded-2xl bg-[#080d26] p-3 border border-amber-400/20 flex flex-col justify-between overflow-hidden">
                    <div>
                      {/* Mobile Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                        <span className="font-cinzel text-xs font-bold gold-gradient-text">AladdinAI</span>
                        <span className="text-[10px] text-cyan-400">● 24/7</span>
                      </div>
                      <p className="text-[11px] font-bold text-white leading-tight">
                        Find Leads.<br />Make Calls.<br /><span className="text-amber-400">Work Like Magic.</span>
                      </p>

                      {/* Mini 3D Lamp inside Phone — Isolated transparent PNG */}
                      <div className="my-2 py-2 flex justify-center">
                        <div className="w-18 h-14 relative animate-lamp-float" style={{ filter: "drop-shadow(0 0 12px rgba(245,158,11,0.6))" }}>
                          <Image
                            src="/aladdin-lamp-3d-isolated.png"
                            alt="Mobile 3D Aladdin Lamp"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Mini Stats */}
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between p-1.5 rounded bg-white/5 border border-white/10">
                          <span className="text-slate-400">Leads:</span>
                          <span className="text-white font-bold">1,248 (↑12%)</span>
                        </div>
                        <div className="flex justify-between p-1.5 rounded bg-white/5 border border-white/10">
                          <span className="text-slate-400">Calls:</span>
                          <span className="text-white font-bold">892 (↑18%)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={onOpenGenie}
                      className="w-full py-1.5 rounded-lg bg-amber-500/30 border border-amber-400/50 text-[10px] font-bold text-amber-200 hover:bg-amber-500/40 transition"
                    >
                      Talk to Genie
                    </button>
                  </div>

                  {/* Phone Home Bar */}
                  <div className="w-24 h-1 bg-slate-500 rounded-full mx-auto mt-2"></div>
                </div>
              </div>

            </div>
          </Flashcard3D>
        </div>

        {/* ─── CARD 5: Ambient Moroccan Lantern & Tools Telemetry ─── */}
        <div className="lg:col-span-4">
          <Flashcard3D glow="gold" className="p-6 glass-aladdin h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 pb-3 mb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-cinzel text-base font-bold text-white">
                    Magic Engine Health
                  </h4>
                  <p className="text-[11px] text-slate-400">Telemetry & Discovery Tools</p>
                </div>
              </div>

              {/* Tools list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-200">CALL-E Voice Server</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">Active</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-200">Google SERP & Maps Scraper</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">Ready</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-200">Company Registry Enriched</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">Verified</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-slate-200">Genie LLM Reasoning Engine</span>
                  </div>
                  <span className="text-[11px] text-cyan-300 font-semibold">Online</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Database: SQLite (13 leads)</span>
              <button
                onClick={onOpenGenie}
                className="text-amber-400 hover:text-amber-300 font-bold"
              >
                Trigger Scan →
              </button>
            </div>
          </Flashcard3D>
        </div>

        {/* ─── CARD 5b: Apollo AI Leads ─── */}
        <div className="lg:col-span-12">
          <ApolloLeadsFlashcard />
        </div>

      </div>

      {/* ─── CARD 6: 4 Bottom Feature Pillars (from the reference image) ─── */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Pillar 1: AI Powered */}
        <Flashcard3D glow="gold" className="p-4 glass-aladdin">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">AI Powered</h4>
              <p className="text-xs text-slate-400">Smart & Human-like</p>
            </div>
          </div>
        </Flashcard3D>

        {/* Pillar 2: 24/7 Calling */}
        <Flashcard3D glow="cyan" className="p-4 glass-aladdin">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Calling</h4>
              <p className="text-xs text-slate-400">Never Miss a Lead</p>
            </div>
          </div>
        </Flashcard3D>

        {/* Pillar 3: Higher Conversions */}
        <Flashcard3D glow="purple" className="p-4 glass-aladdin">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Higher Conversions</h4>
              <p className="text-xs text-slate-400">More Meetings, More Revenue</p>
            </div>
          </div>
        </Flashcard3D>

        {/* Pillar 4: Easy to Use */}
        <Flashcard3D glow="gold" className="p-4 glass-aladdin">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Easy to Use</h4>
              <p className="text-xs text-slate-400">Set It & Get Results</p>
            </div>
          </div>
        </Flashcard3D>

      </div>

    </section>
  );
}
