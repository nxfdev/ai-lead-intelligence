"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Sparkles, X, ArrowRight } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (criteriaSummary: string) => void;
}

export function DocumentUploadModal({ isOpen, onClose, onComplete }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState(
    "We sell AI receptionists to dental practices in the Austin area with 10+ employees."
  );
  const [step, setStep] = useState<"IDLE" | "ANALYZING" | "CRITERIA" | "SEARCHING" | "FOUND">("IDLE");
  const [progressMsg, setProgressMsg] = useState("");

  if (!isOpen) return null;

  const handleStartAnalysis = () => {
    setStep("ANALYZING");
    setProgressMsg("Analyzing documents and business model...");

    setTimeout(() => {
      setStep("CRITERIA");
      setProgressMsg("Building your lead criteria (Dental Clinics · Austin + 50mi · 10+ staff)...");
    }, 1200);

    setTimeout(() => {
      setStep("SEARCHING");
      setProgressMsg("Searching and collecting evidence on 37 candidates in Austin, TX...");
    }, 2500);

    setTimeout(() => {
      setStep("FOUND");
      setProgressMsg("8 high-match leads surfaced with verified hypothesis signals.");
    }, 4000);
  };

  const handleCommit = () => {
    onComplete("Dental Practices in Austin, TX with missed-call indicators");
    onClose();
    setStep("IDLE");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-black border-2 border-[#1F1F1F] p-6 md:p-8 text-white relative shadow-[0_0_50px_rgba(0,0,0,0.95)]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#EFCD5E] mb-1">
            INGEST BUSINESS CONTEXT
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            Upload Product Deck or Criteria
          </h2>
          <p className="text-xs text-neutral-400 tracking-wide mt-1">
            Dial O converts your documentation into verifiable lead criteria before any outreach.
          </p>
        </div>

        {step === "IDLE" ? (
          <div className="space-y-5">
            {/* Drag and drop area */}
            <div className="border-2 border-dashed border-[#2E2E2E] hover:border-[#00FFFF] transition-colors p-8 text-center cursor-pointer bg-[#080808]">
              <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <div className="text-xs font-bold uppercase tracking-widest text-neutral-300">
                DRAG & DROP PDF, DOCX, TXT, OR MD
              </div>
              <div className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                MAX 25MB · AIR-GAPPED PARSING
              </div>
            </div>

            {/* Prompt description */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-neutral-400 mb-1.5 font-mono">
                Or state your value proposition:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#0D0D0D] border border-[#242424] focus:border-[#00FFFF] p-3 text-xs text-white placeholder-neutral-600 outline-none transition-colors font-mono"
              />
            </div>

            <button
              onClick={handleStartAnalysis}
              className="w-full bg-[#EFCD5E] hover:bg-[#F8DA76] text-black font-bold uppercase tracking-[0.2em] py-3 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_2px_12px_rgba(239,205,94,0.3)]"
            >
              <span>RUN INTELLIGENCE PIPELINE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase">
                <span className="text-neutral-400">STATUS:</span>
                <span className="text-[#00FFFF] font-bold">{step}</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 border border-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00FFFF] via-[#EFCD5E] to-[#FF751F] transition-all duration-500"
                  style={{
                    width:
                      step === "ANALYZING"
                        ? "25%"
                        : step === "CRITERIA"
                        ? "55%"
                        : step === "SEARCHING"
                        ? "85%"
                        : "100%",
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-[#0D0D0D] border border-[#242424] text-xs font-mono space-y-2">
              <div className="flex items-center gap-2 text-white">
                {step === "FOUND" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00FFFF]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#EFCD5E] animate-spin" />
                )}
                <span>{progressMsg}</span>
              </div>

              {step === "FOUND" && (
                <div className="pt-3 border-t border-[#1F1F1F] space-y-1 text-neutral-400 text-[11px]">
                  <div>✓ Target: Dental Clinics in Austin, TX</div>
                  <div>✓ Signal: No online booking, staffing overtime, missed calls</div>
                  <div>✓ Top Match: Austin Smile Center (Score: 94 / 100)</div>
                </div>
              )}
            </div>

            {step === "FOUND" && (
              <button
                onClick={handleCommit}
                className="w-full bg-[#00FFFF] hover:bg-[#5fffff] text-black font-bold uppercase tracking-[0.2em] py-3 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>SURFACE LEADS ON CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
