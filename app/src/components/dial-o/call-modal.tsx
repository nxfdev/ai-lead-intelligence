"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneOff, CheckCircle2, ShieldAlert, Sparkles, X, User, Building, AlertCircle } from "lucide-react";

export type CallStage = "READY" | "PREPARING" | "CALLING" | "IN_PROGRESS" | "ANALYZING" | "VERIFIED";

export interface CallSimulationResult {
  decisionMakerReached: boolean;
  needConfirmed: boolean;
  currentSolution: string;
  pain: string;
  nextAction: string;
  notes: string;
}

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    name: string;
    phone: string;
    category: string;
    location: string;
    decisionMaker?: string | null;
    hypothesis?: string | null;
  } | null;
  onCallComplete: (leadId: string, result: CallSimulationResult) => void;
}

export function CallModal({ isOpen, onClose, lead, onCallComplete }: CallModalProps) {
  const [stage, setStage] = useState<CallStage>("READY");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!isOpen || !lead) {
      setStage("READY");
      setTimer(0);
      return;
    }

    // Auto-advance through the synthetic CALL-E stages
    setStage("PREPARING");

    const t1 = setTimeout(() => {
      setStage("CALLING");
    }, 1400);

    const t2 = setTimeout(() => {
      setStage("IN_PROGRESS");
    }, 3000);

    const t3 = setTimeout(() => {
      setStage("ANALYZING");
    }, 6500);

    const t4 = setTimeout(() => {
      setStage("VERIFIED");
      const result: CallSimulationResult = {
        decisionMakerReached: true,
        needConfirmed: true,
        currentSolution: "Single human receptionist, overwhelmed during 8am-11am peaks",
        pain: "Missed calls resulting in estimated 5-10 lost appointment bookings weekly",
        nextAction: "Schedule product demo for upcoming Tuesday with practice owner",
        notes: "Decision maker confirmed phone accessibility is their top operational bottleneck.",
      };
      onCallComplete(lead.id, result);
    }, 8500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, lead]);

  // Call duration timer while IN_PROGRESS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === "IN_PROGRESS") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage]);

  if (!isOpen || !lead) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-black border-2 border-[#1F1F1F] p-6 md:p-8 text-white relative shadow-[0_0_60px_rgba(0,0,0,0.95)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#FF751F] text-black flex items-center justify-center font-black text-sm">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs tracking-[0.25em] text-[#EFCD5E] uppercase font-bold">
                CALL-E AUTONOMOUS PHONE AGENT
              </div>
              <div className="text-base font-black tracking-wider uppercase text-white">
                {lead.name}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Summary */}
        <div className="bg-[#0D0D0D] border border-[#242424] p-4 mb-6 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-neutral-400">
            <span>TARGET PHONE:</span>
            <span className="text-white font-bold">{lead.phone}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>DECISION MAKER:</span>
            <span className="text-white font-bold">{lead.decisionMaker || "Practice Manager / Owner"}</span>
          </div>
          <div className="text-neutral-400 pt-1">
            <span>HYPOTHESIS: </span>
            <span className="text-[#00FFFF]">{lead.hypothesis || "Clinic loses calls during busy operational periods."}</span>
          </div>
        </div>

        {/* Dynamic Stage Display */}
        <div className="text-center py-6 border border-[#242424] bg-[#050505] mb-6">
          {stage === "PREPARING" && (
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] text-[#EFCD5E] font-bold animate-pulse">
                SYNTHESIZING CALL BRIEF & VERIFICATION OBJECTIVES...
              </span>
              <p className="text-[11px] text-neutral-400">
                Extracting tailored objection handlers and qualification questions.
              </p>
            </div>
          )}

          {stage === "CALLING" && (
            <div className="space-y-3">
              <div className="inline-block p-4 rounded-full bg-[#00FFFF]/10 border border-[#00FFFF]/40 text-[#00FFFF] animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              <div className="text-sm uppercase tracking-[0.25em] text-[#00FFFF] font-black">
                DIALING {lead.phone}...
              </div>
              <p className="text-[11px] text-neutral-400">Routing through secure telephonic SIP gateway.</p>
            </div>
          )}

          {stage === "IN_PROGRESS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-1.5 h-10">
                <div className="waveform-bar" style={{ animationDelay: "0.1s" }} />
                <div className="waveform-bar" style={{ animationDelay: "0.25s", height: "22px" }} />
                <div className="waveform-bar" style={{ animationDelay: "0.4s", height: "30px" }} />
                <div className="waveform-bar" style={{ animationDelay: "0.15s", height: "18px" }} />
                <div className="waveform-bar" style={{ animationDelay: "0.3s", height: "26px" }} />
                <div className="waveform-bar" style={{ animationDelay: "0.5s", height: "14px" }} />
              </div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-[#00FFFF]">
                CONVERSATION IN PROGRESS · 00:{timer < 10 ? `0${timer}` : timer}
              </div>
              <p className="text-xs text-neutral-300 italic px-4">
                &ldquo;Hi, I&apos;m calling regarding Dr. Mitchell&apos;s clinic. We understand you manage patient appointments...&rdquo;
              </p>
            </div>
          )}

          {stage === "ANALYZING" && (
            <div className="space-y-3">
              <Sparkles className="w-6 h-6 text-[#EFCD5E] mx-auto animate-spin" />
              <div className="text-sm uppercase tracking-[0.25em] text-[#EFCD5E] font-black">
                ANALYZING LIVE TRANSCRIPT & STRUCTURING FINDINGS...
              </div>
              <p className="text-[11px] text-neutral-400">Verifying customer need against core hypothesis.</p>
            </div>
          )}

          {stage === "VERIFIED" && (
            <div className="space-y-4 text-left p-4">
              <div className="flex items-center gap-2 text-[#00FFFF] font-black text-sm uppercase tracking-[0.2em]">
                <CheckCircle2 className="w-5 h-5" />
                <span>HYPOTHESIS VERIFIED · QUALIFIED OPPORTUNITY</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
                <div className="bg-[#121212] p-2.5 border border-[#242424]">
                  <span className="text-neutral-500 block text-[10px]">DECISION MAKER REACHED:</span>
                  <span className="text-[#00FFFF] font-bold">YES (Confirmed)</span>
                </div>
                <div className="bg-[#121212] p-2.5 border border-[#242424]">
                  <span className="text-neutral-500 block text-[10px]">NEED CONFIRMED:</span>
                  <span className="text-[#00FFFF] font-bold">YES (Peak Overload)</span>
                </div>
                <div className="col-span-2 bg-[#121212] p-2.5 border border-[#242424]">
                  <span className="text-neutral-500 block text-[10px]">IDENTIFIED PAIN:</span>
                  <span className="text-white">Clinic misses 5-10 patient bookings per week during morning rush.</span>
                </div>
                <div className="col-span-2 bg-[#121212] p-2.5 border border-[#242424]">
                  <span className="text-neutral-500 block text-[10px]">RECOMMENDED NEXT ACTION:</span>
                  <span className="text-[#EFCD5E] font-bold">Schedule product demo with Dr. Sarah Mitchell for next week</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1F1F1F]">
          <span className="text-[10px] text-neutral-500 uppercase font-mono">
            SYNTHETIC DEMO MODE · AIR-GAPPED SECURE API
          </span>

          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              stage === "VERIFIED"
                ? "bg-[#00FFFF] text-black hover:bg-[#5fffff]"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {stage === "VERIFIED" ? "COMMIT TO CONSOLE" : "CANCEL CALL"}
          </button>
        </div>
      </div>
    </div>
  );
}
