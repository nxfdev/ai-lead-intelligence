"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Sparkles,
  Paperclip,
  Send,
  Building,
  MapPin,
  Phone,
  HelpCircle,
  FileText,
  AlertTriangle,
  ChevronRight,
  Info,
  Layers,
  X,
  UserCheck,
  Download,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { DialOLogo } from "./dial-o-logo";
import { CallModal, CallSimulationResult } from "./call-modal";
import { DocumentUploadModal } from "./document-upload-modal";

export interface LeadItem {
  id: string;
  name: string;
  category: string;
  location: string;
  phone: string;
  score: number;
  scoreBreakdown: {
    icpFit: number;
    businessQuality: number;
    painSignal: number;
    intent: number;
    recency: number;
    contactability: number;
  };
  hypothesis: string;
  evidence: Array<{
    type: "OBSERVED" | "HYPOTHESIS" | "VERIFIED BY CALL";
    text: string;
  }>;
  status: "QUALIFIED" | "VERIFIED OPPORTUNITY" | "FOLLOW-UP" | "IN_PROGRESS";
  decisionMaker: string;
  lastCallTime?: string;
  callNotes?: string;
}

export interface CallLogItem {
  id: string;
  leadId: string;
  businessName: string;
  status: "Verified" | "Completed" | "Follow-up";
  duration: string;
  summary: string;
  nextAction: string;
  timestamp: string;
}

const INITIAL_LEADS: LeadItem[] = [
  {
    id: "lead-1",
    name: "Austin Smile Center",
    category: "Cosmetic & General Dentistry",
    location: "Austin, TX (Downtown)",
    phone: "+1 (512) 555-1001",
    score: 94,
    scoreBreakdown: {
      icpFit: 25,
      businessQuality: 15,
      painSignal: 24,
      intent: 18,
      recency: 8,
      contactability: 4,
    },
    hypothesis:
      "High-volume cosmetic dental practice running 4 operatories. Customer reviews note front-desk staff frequently put callers on extended hold times during peak morning hours.",
    evidence: [
      { type: "OBSERVED", text: "No online appointment booking detected on domain" },
      { type: "OBSERVED", text: "Recent job posting for Front Desk Patient Coordinator" },
      { type: "HYPOTHESIS", text: "Estimated 8-12 missed new-patient inquiries per business day" },
      { type: "VERIFIED BY CALL", text: "Office Manager confirmed reception overload from 8AM to 11AM" },
    ],
    status: "VERIFIED OPPORTUNITY",
    decisionMaker: "Dr. Sarah Mitchell (Owner) & Mark Johnson (Office Mgr)",
    lastCallTime: "1h ago",
    callNotes: "Decision maker confirmed interest in automated answering during peak rush.",
  },
  {
    id: "lead-2",
    name: "Lone Star Emergency Dentistry",
    category: "Emergency Dental Clinic",
    location: "Austin, TX (North Loop)",
    phone: "+1 (512) 555-1007",
    score: 91,
    scoreBreakdown: {
      icpFit: 24,
      businessQuality: 14,
      painSignal: 23,
      intent: 17,
      recency: 9,
      contactability: 4,
    },
    hypothesis:
      "24-hour emergency clinic loses approximately 40% of nighttime incoming calls when clinical staff are actively occupied in surgical procedures.",
    evidence: [
      { type: "OBSERVED", text: "Website advertises 'Open 24/7' but phone rings out after hours" },
      { type: "OBSERVED", text: "3 Google reviews cite unreachable reception after 9PM" },
      { type: "HYPOTHESIS", text: "Immediate revenue leakage from high-urgency tooth extraction inquiries" },
      { type: "VERIFIED BY CALL", text: "Dr. Marcus Vance confirmed night staff cannot prioritize phone rings" },
    ],
    status: "VERIFIED OPPORTUNITY",
    decisionMaker: "Dr. Marcus Vance (Managing Partner)",
    lastCallTime: "2h ago",
    callNotes: "Urgent need for after-hours automated triaging and booking.",
  },
  {
    id: "lead-3",
    name: "Capital City Dental Care",
    category: "Family & Pediatric Dentistry",
    location: "Austin, TX (South Lamar)",
    phone: "+1 (512) 555-1014",
    score: 88,
    scoreBreakdown: {
      icpFit: 22,
      businessQuality: 14,
      painSignal: 22,
      intent: 16,
      recency: 9,
      contactability: 5,
    },
    hypothesis:
      "Dual-provider practice with extended Saturday appointments. High telephone volume overwhelms reception during weekend shifts.",
    evidence: [
      { type: "OBSERVED", text: "Extended Saturday hours (8AM - 4PM) with limited staff" },
      { type: "OBSERVED", text: "Online reviews mention busy signals on Saturday mornings" },
      { type: "HYPOTHESIS", text: "High patient acquisition cost being squandered on unanswered inquiries" },
    ],
    status: "QUALIFIED",
    decisionMaker: "Dr. Elena Roberts (Clinical Director)",
  },
  {
    id: "lead-4",
    name: "Pflugerville Dental Associates",
    category: "Restorative Dentistry",
    location: "Pflugerville, TX (Austin Metro)",
    phone: "+1 (512) 555-1022",
    score: 85,
    scoreBreakdown: {
      icpFit: 22,
      businessQuality: 13,
      painSignal: 21,
      intent: 15,
      recency: 9,
      contactability: 5,
    },
    hypothesis:
      "Rapidly growing suburban dental office adding 2 new dentist chairs next month. Reception capacity lagging clinical growth.",
    evidence: [
      { type: "OBSERVED", text: "Announced clinic expansion on LinkedIn last week" },
      { type: "OBSERVED", text: "Traditional PBX phone line with no IVR or automated menu" },
      { type: "HYPOTHESIS", text: "Anticipates needing additional phone coverage before Q3" },
    ],
    status: "QUALIFIED",
    decisionMaker: "Dr. Kevin Park (Practice Owner)",
  },
];

const INITIAL_CALL_LOGS: CallLogItem[] = [
  {
    id: "call-1",
    leadId: "lead-1",
    businessName: "Austin Smile Center",
    status: "Verified",
    duration: "94s",
    summary: "Owner confirmed the clinic misses 8-12 calls per day during busy periods. Paying staff overtime.",
    nextAction: "Schedule product demo with Dr. Sarah Mitchell for next Tuesday",
    timestamp: "1h ago",
  },
  {
    id: "call-2",
    leadId: "lead-2",
    businessName: "Lone Star Emergency Dentistry",
    status: "Verified",
    duration: "110s",
    summary: "Dr. Marcus Vance answered between emergency patients. Confirmed night calls are lost 40% of the time.",
    nextAction: "Send technical specs for after-hours call routing",
    timestamp: "2h ago",
  },
  {
    id: "call-3",
    leadId: "lead-3",
    businessName: "Capital City Dental Care",
    status: "Completed",
    duration: "82s",
    summary: "Spoke with front desk coordinator. Requested email follow-up before transferring to Dr. Roberts.",
    nextAction: "Send intro email and phone case study",
    timestamp: "3h ago",
  },
];

export function ConsoleSection() {
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>(INITIAL_CALL_LOGS);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("lead-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQual, setFilterQual] = useState("ALL");
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "name-asc">("score-desc");
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set(["lead-1"]));
  const [mobileTab, setMobileTab] = useState<"leads" | "calls" | "copilot">("leads");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<LeadItem | null>(null);
  const [inspectLead, setInspectLead] = useState<LeadItem | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Sync with live backend API when available
  useEffect(() => {
    async function syncBackendData() {
      try {
        const [leadsRes, callsRes] = await Promise.allSettled([
          fetch("/api/leads?sortBy=score&sortOrder=desc"),
          fetch("/api/calls"),
        ]);
        if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
          const data = await leadsRes.value.json();
          if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
            const mappedLeads: LeadItem[] = data.leads.map((l: any) => ({
              id: l.id,
              name: l.name,
              category: l.category || "Cosmetic & General Dentistry",
              location: l.location || "Austin, TX",
              phone: l.phone || "+1 (512) 555-0100",
              score: typeof l.score === "number" ? l.score : 88,
              scoreBreakdown: l.scoreComponents || {
                icpFit: 23,
                businessQuality: 14,
                painSignal: 22,
                intent: 16,
                recency: 8,
                contactability: 5,
              },
              hypothesis: l.hypothesis || "Potential qualification candidate based on business profile match.",
              evidence: Array.isArray(l.evidence) && l.evidence.length > 0
                ? l.evidence.map((ev: any) => ({
                    type: ev.type === "VERIFIED" ? "VERIFIED BY CALL" : (ev.type === "OBSERVED" ? "OBSERVED" : "HYPOTHESIS"),
                    text: ev.claim || ev.text || "Signal observed from web inspection",
                  }))
                : [
                    { type: "OBSERVED", text: "Active commercial practice in target metro" },
                    { type: "HYPOTHESIS", text: "Match with configured ICP parameters" },
                  ],
              status: l.status === "VERIFIED" ? "VERIFIED OPPORTUNITY" : "QUALIFIED",
              decisionMaker: l.decisionMaker || "Managing Principal",
              lastCallTime: l.latestCall ? "Recently" : undefined,
              callNotes: l.latestCall?.result?.summary || undefined,
            }));
            setLeads((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newItems = mappedLeads.filter((item) => !existingIds.has(item.id));
              return [...newItems, ...prev];
            });
          }
        }
        if (callsRes.status === "fulfilled" && callsRes.value.ok) {
          const callData = await callsRes.value.json();
          if (callData.calls && Array.isArray(callData.calls) && callData.calls.length > 0) {
            const mappedCalls: CallLogItem[] = callData.calls.map((c: any) => ({
              id: c.id,
              leadId: c.leadId,
              businessName: c.lead?.name || "Target Prospect",
              status: c.status === "COMPLETED" ? "Verified" : "Completed",
              duration: c.duration ? `${c.duration}s` : "90s",
              summary: c.result?.summary || "Autonomous phone agent verified hypothesis.",
              nextAction: c.result?.nextAction || "Follow-up recommended",
              timestamp: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
            }));
            setCallLogs((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newItems = mappedCalls.filter((item) => !existingIds.has(item.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn("Backend API sync completed offline fallback:", err);
      }
    }
    syncBackendData();
  }, []);

  // Copilot Chat state
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([
    {
      role: "assistant",
      text: "Autonomous Lead Intelligence Console active.\n\nI analyze business profiles, compile verifiable evidence signals, explain AI scoring hypotheses, and coordinate **CALL-E voice qualification**.\n\nHow can I assist with your prospect queue?",
    },
  ]);
  const [copilotInput, setCopilotInput] = useState("");

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Filtered and sorted leads
  const filteredLeads = leads
    .filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterQual === "ALL") return matchesSearch;
      if (filterQual === "VERIFIED") return matchesSearch && lead.status === "VERIFIED OPPORTUNITY";
      if (filterQual === "QUALIFIED") return matchesSearch && lead.status === "QUALIFIED";
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "score-desc") return b.score - a.score;
      if (sortBy === "score-asc") return a.score - b.score;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      return 0;
    });

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCallComplete = (leadId: string, result: CallSimulationResult) => {
    // Update lead in state
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            score: Math.min(100, l.score + 5),
            status: "VERIFIED OPPORTUNITY",
            lastCallTime: "Just now",
            callNotes: result.notes,
            evidence: [
              ...l.evidence.filter((e) => e.type !== "VERIFIED BY CALL"),
              { type: "VERIFIED BY CALL", text: result.notes },
            ],
          };
        }
        return l;
      })
    );

    // Add to call log
    const targetLead = leads.find((l) => l.id === leadId);
    if (targetLead) {
      const newLog: CallLogItem = {
        id: `call-${Date.now()}`,
        leadId,
        businessName: targetLead.name,
        status: "Verified",
        duration: "95s",
        summary: result.notes,
        nextAction: result.nextAction,
        timestamp: "Just now",
      };
      setCallLogs((prev) => [newLog, ...prev]);

      // Add to Copilot message log
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `**CALL-E Verified Call Complete for ${targetLead.name}**\n\n- **Decision Maker:** Reached & confirmed\n- **Identified Pain:** ${result.pain}\n- **Current Solution:** ${result.currentSolution}\n- **Next Action:** ${result.nextAction}\n\nLead status promoted to **VERIFIED OPPORTUNITY** with score adjusted to ${Math.min(100, targetLead.score + 5)}/100.`,
        },
      ]);
    }

    setSelectedLeadForCall(null);
  };

  const handleSendCopilot = async (questionText?: string) => {
    const q = questionText || copilotInput;
    if (!q.trim() || isCopilotLoading) return;

    const userMsg = q;
    setCopilotMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    if (!questionText) setCopilotInput("");
    setIsCopilotLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          selectedLeadId: selectedLead?.id,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.content) {
          setCopilotMessages((prev) => [
            ...prev,
            { role: "assistant", text: json.data.content },
          ]);
          setIsCopilotLoading(false);
          return;
        }
      }
    } catch {
      // Fallback seamlessly
    }

    // Smart context-aware fallback reasoning engine
    setTimeout(() => {
      let reply = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("why") || lower.includes("call")) {
        reply = `**Why Call ${selectedLead.name}:**\n\n1. **ICP Match:** Top tier score of ${selectedLead.score}/100 based on employee size and category.\n2. **Observed Signals:** ${selectedLead.evidence.filter((e) => e.type === "OBSERVED").map((e) => e.text).join("; ")}.\n3. **Hypothesis:** ${selectedLead.hypothesis}\n\n*Recommendation:* Initiate CALL-E call to test whether front-desk overload is active.`;
      } else if (lower.includes("evidence")) {
        reply = `**Evidence Dossier for ${selectedLead.name}:**\n\n${selectedLead.evidence.map((e) => `• **[${e.type}]**: ${e.text}`).join("\n")}\n\nNote that items marked *HYPOTHESIS* are not asserted as fact until verified by a conversation.`;
      } else if (lower.includes("verify") || lower.includes("calle") || lower.includes("call-e")) {
        const verifiedEv = selectedLead.evidence.find((e) => e.type === "VERIFIED BY CALL");
        if (verifiedEv) {
          reply = `**CALL-E Verification Record:**\n\n"${verifiedEv.text}"\n\nDecision maker confirmed operational bottleneck during live phone conversation.`;
        } else {
          reply = `${selectedLead.name} has not been verified by CALL-E yet. Click **CALL LEAD** to trigger the autonomous phone agent.`;
        }
      } else {
        reply = `Understood. Analyzing parameters for **${selectedLead.name}**. Current status is **${selectedLead.status}** with score **${selectedLead.score}/100** across 6 intelligence dimensions.`;
      }

      setCopilotMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setIsCopilotLoading(false);
    }, 450);
  };

  return (
    <section id="console" className="relative w-full bg-black text-black">
      {/* ══════════════════════════════════════════════════════════════
          PAGE 5 HEADER: ORANGE ACCENT STRIP WITH BRANDING
          ══════════════════════════════════════════════════════════════ */}
      <div className="w-full bg-[#FF751F] flex flex-wrap items-center justify-between gap-4 border-b-2 border-black" style={{ padding: "16px 48px" }}>
        <div className="flex items-center gap-5">
          <DialOLogo size="md" variant="hero" />
          <span className="text-black font-black uppercase border-l-2 border-black font-modular" style={{ fontSize: "20px", letterSpacing: "0.2em", paddingLeft: "20px" }}>
            INTELLIGENCE CONSOLE
          </span>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-3">
          {/* Synthetic Mode Badge (Mandatory Requirement) */}
          <div className="bg-black text-[#00FFFF] font-black uppercase flex items-center gap-2" style={{ fontSize: "12px", letterSpacing: "0.15em", padding: "8px 14px", border: "1px solid #000" }}>
            <span className="rounded-full bg-[#00FFFF] animate-pulse" style={{ width: "8px", height: "8px", display: "inline-block" }} />
            <span>SYNTHETIC DEMO MODE</span>
          </div>

          <button
            onClick={() => setIsDocModalOpen(true)}
            className="bg-[#EFCD5E] hover:bg-[#F8DA76] text-black font-black uppercase tracking-wider border border-black transition-colors cursor-pointer flex items-center gap-2 shadow-[0_2px_0_#000000] font-modular"
            style={{ fontSize: "14px", padding: "8px 16px" }}
          >
            <FileText style={{ width: "16px", height: "16px" }} />
            <span>INGEST CRITERIA</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PAGE 5 BODY: CYAN BACKGROUND WITH 3 OPERATIONAL COLUMNS
          Left: CALL LOGS (~20%)
          Center: LEAD INTELLIGENCE (~50%)
          Right: AUTONOMOUS COPILOT (~30%)
          ══════════════════════════════════════════════════════════════ */}
      <div className="w-full bg-[#00FFFF] p-4 sm:p-6 lg:p-8 dial-grid-cyan">
        <div className="max-w-[1600px] mx-auto">
          {/* Mobile Tab Switcher (Visible on mobile, hides on desktop) */}
          <div className="flex lg:hidden w-full mb-4 border-2 border-black bg-white shadow-[0_4px_0_#000000]">
            <button
              onClick={() => setMobileTab("leads")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                mobileTab === "leads" ? "bg-black text-[#00FFFF]" : "text-black hover:bg-neutral-100"
              }`}
            >
              LEADS ({filteredLeads.length})
            </button>
            <button
              onClick={() => setMobileTab("calls")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider border-l-2 border-r-2 border-black transition-colors ${
                mobileTab === "calls" ? "bg-black text-[#EFCD5E]" : "text-black hover:bg-neutral-100"
              }`}
            >
              CALLS ({callLogs.length})
            </button>
            <button
              onClick={() => setMobileTab("copilot")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                mobileTab === "copilot" ? "bg-black text-[#FF751F]" : "text-black hover:bg-neutral-100"
              }`}
            >
              COPILOT
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ──────────────────────────────────────────────────────────
                COLUMN 1: CALL LOGS (~20% = 3 of 12 cols on desktop)
                Mobile: Order 2 (Prioritized after Lead Intelligence)
                ────────────────────────────────────────────────────────── */}
            <div
              className={`lg:col-span-3 console-panel-card border-2 border-black p-4 flex flex-col max-h-[820px] overflow-hidden order-2 lg:order-1 ${
                mobileTab === "calls" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#FF751F] border border-black" style={{ flexShrink: 0 }} />
                  <h3 className="console-panel-header font-modular font-black uppercase" style={{ fontSize: "42px", letterSpacing: "0.12em", lineHeight: 1 }}>
                    CALL LOGS
                  </h3>
                </div>
                <span className="font-mono font-bold bg-neutral-200 border border-black" style={{ fontSize: "14px", padding: "4px 10px" }}>
                  {callLogs.length} CALLS
                </span>
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                {callLogs.map((log) => {
                  const isSelected = log.leadId === selectedLeadId;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLeadId(log.leadId)}
                      className={`border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-black text-white border-black shadow-[0_4px_0_#FF751F]"
                          : "bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-300"
                      }`}
                      style={{ padding: "14px" }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
                        <span className="font-black uppercase tracking-wider truncate" style={{ fontSize: "15px", marginRight: "8px" }}>
                          {log.businessName}
                        </span>
                        <span
                          className={`font-bold uppercase tracking-wider ${
                            log.status === "Verified"
                              ? "bg-[#00FFFF] text-black"
                              : "bg-[#EFCD5E] text-black"
                          }`}
                          style={{ fontSize: "11px", padding: "3px 8px", whiteSpace: "nowrap" }}
                        >
                          {log.status}
                        </span>
                      </div>

                      <p className="leading-snug line-clamp-2 font-medium" style={{ fontSize: "13px", opacity: 0.8, marginBottom: "8px" }}>
                        {log.summary}
                      </p>

                      <div className="flex items-center justify-between font-mono opacity-70 border-t border-current/20" style={{ fontSize: "11px", paddingTop: "6px" }}>
                        <span>{log.duration}</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ──────────────────────────────────────────────────────────
                COLUMN 2: LEAD INTELLIGENCE (~50% = 6 of 12 cols on desktop)
                Primary work surface · Mobile: Order 1 (Top Priority)
                ────────────────────────────────────────────────────────── */}
            <div
              className={`lg:col-span-6 console-panel-card border-2 border-black p-5 flex flex-col min-h-[820px] order-1 lg:order-2 ${
                mobileTab === "leads" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Top Operational Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-neutral-100 border-2 border-black p-3">
                  <div className="uppercase font-bold tracking-wider text-neutral-600" style={{ fontSize: "12px" }}>
                    Total Discovered
                  </div>
                  <div className="font-black text-black" style={{ fontSize: "30px", marginTop: "4px" }}>{leads.length}</div>
                </div>
                <div className="bg-neutral-100 border-2 border-black p-3">
                  <div className="uppercase font-bold tracking-wider text-neutral-600" style={{ fontSize: "12px" }}>
                    High Match (70+)
                  </div>
                  <div className="font-black text-[#FF751F]" style={{ fontSize: "30px", marginTop: "4px" }}>
                    {leads.filter((l) => l.score >= 70).length}
                  </div>
                </div>
                <div className="bg-neutral-100 border-2 border-black p-3">
                  <div className="uppercase font-bold tracking-wider text-neutral-600" style={{ fontSize: "12px" }}>
                    Calls Placed
                  </div>
                  <div className="font-black text-black" style={{ fontSize: "30px", marginTop: "4px" }}>{callLogs.length}</div>
                </div>
                <div className="bg-neutral-100 border-2 border-black p-3">
                  <div className="uppercase font-bold tracking-wider text-neutral-600" style={{ fontSize: "12px" }}>
                    AI Verified
                  </div>
                  <div className="font-black text-[#00FFFF] drop-shadow-[0_1px_1px_#000000]" style={{ fontSize: "30px", marginTop: "4px" }}>
                    {leads.filter((l) => l.status === "VERIFIED OPPORTUNITY").length}
                  </div>
                </div>
              </div>

              {/* Filter, Sort, Bulk, and Export CSV Bar */}
              <div className="flex flex-col gap-2.5 mb-5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter by business name, city, specialty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border-2 border-black bg-white placeholder-neutral-500 font-mono outline-none"
                    />
                  </div>

                  <select
                    value={filterQual}
                    onChange={(e) => setFilterQual(e.target.value)}
                    className="text-xs border-2 border-black bg-white px-3 py-2 font-mono uppercase font-bold outline-none cursor-pointer"
                  >
                    <option value="ALL">All Qualifications</option>
                    <option value="VERIFIED">Verified Only</option>
                    <option value="QUALIFIED">Qualified Prospects</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs border-2 border-black bg-white px-3 py-2 font-mono uppercase font-bold outline-none cursor-pointer"
                  >
                    <option value="score-desc">Score: High → Low</option>
                    <option value="score-asc">Score: Low → High</option>
                    <option value="name-asc">Company: A → Z</option>
                  </select>

                  <a
                    href="/api/leads/export?format=csv"
                    download="leads.csv"
                    className="px-3 py-2 bg-black text-[#00FFFF] hover:bg-neutral-800 border-2 border-black text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Export lead intelligence dataset to CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </a>
                </div>

                {/* Bulk Selection and Count Header */}
                <div className="flex items-center justify-between px-1 py-1 text-xs font-mono border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 hover:text-[#FF751F] transition-colors cursor-pointer text-[11px] font-bold uppercase"
                  >
                    {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#FF751F]" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                    <span>Select All ({filteredLeads.length})</span>
                  </button>

                  {selectedLeadIds.size > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black text-[#EFCD5E]">
                      {selectedLeadIds.size} SELECTED
                    </span>
                  )}
                </div>
              </div>

              {/* Leads List */}
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[620px] pr-1">
                {filteredLeads.map((lead) => {
                  const isSelected = lead.id === selectedLeadId;
                  const isChecked = selectedLeadIds.has(lead.id);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`border-2 transition-all p-4 cursor-pointer ${
                        isSelected
                          ? "bg-white border-black shadow-[0_6px_0_#000000]"
                          : "bg-neutral-50 border-neutral-300 hover:border-black"
                      }`}
                    >
                      {/* Top Row: Checkbox + Score + Name + Actions */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={(e) => toggleSelectLead(lead.id, e)}
                            className="p-1 hover:text-[#FF751F] text-neutral-400 cursor-pointer self-center"
                            aria-label="Toggle selection"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-[#FF751F]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          {/* 100-Point Score Badge with Explainability Trigger */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectLead(lead);
                            }}
                            title="Click to view explainable 100-point scoring breakdown"
                            className="w-12 h-12 bg-black text-[#00FFFF] border-2 border-black flex flex-col items-center justify-center font-black transition-transform hover:scale-105 cursor-pointer shadow-[0_2px_0_#FF751F]"
                          >
                            <span className="text-base leading-none">{lead.score}</span>
                            <span className="text-[8px] font-mono uppercase text-neutral-400">SCORE</span>
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black uppercase tracking-wider text-black">
                                {lead.name}
                              </h4>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider border border-black ${
                                  lead.status === "VERIFIED OPPORTUNITY"
                                    ? "bg-[#00FFFF] text-black"
                                    : "bg-[#EFCD5E] text-black"
                                }`}
                              >
                                {lead.status}
                              </span>
                            </div>

                            <div className="text-xs text-neutral-600 font-mono mt-0.5 flex flex-wrap gap-x-3">
                              <span>{lead.category}</span>
                              <span>·</span>
                              <span>{lead.location}</span>
                              <span>·</span>
                              <span className="font-bold text-black">{lead.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Call Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadForCall(lead);
                          }}
                          className="px-3.5 py-2 bg-[#FF751F] hover:bg-[#ff893d] text-black font-black text-xs uppercase tracking-wider border-2 border-black flex items-center gap-1.5 shadow-[0_2px_0_#000000] transition-transform active:translate-y-0.5 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>CALL LEAD</span>
                        </button>
                      </div>

                      {/* Hypothesis (Differentiated from Facts) */}
                      <div className="my-2.5 p-2.5 bg-neutral-100 border border-neutral-300 text-xs font-mono">
                        <span className="font-bold text-[#FF751F] uppercase mr-1">Hypothesis:</span>
                        <span className="text-neutral-800">{lead.hypothesis}</span>
                      </div>

                      {/* Evidence Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.evidence.map((ev, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-black ${
                              ev.type === "VERIFIED BY CALL"
                                ? "bg-[#00FFFF] text-black font-black"
                                : ev.type === "OBSERVED"
                                ? "bg-neutral-200 text-neutral-800"
                                : "bg-[#EFCD5E]/40 text-black"
                            }`}
                          >
                            <span className="opacity-70 mr-1">[{ev.type}]:</span>
                            {ev.text}
                          </span>
                        ))}
                      </div>

                      {/* Footer / Details Drawer Trigger */}
                      <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-500">
                          Decision Maker: <strong className="text-black">{lead.decisionMaker}</strong>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectLead(lead);
                          }}
                          className="text-black font-bold uppercase text-[10px] hover:text-[#FF751F] transition-colors flex items-center gap-1"
                        >
                          <span>VIEW EVIDENCE DOSSIER</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ──────────────────────────────────────────────────────────
                COLUMN 3: AUTONOMOUS COPILOT (~30% = 3 of 12 cols on desktop)
                Reasoning & control interface · Mobile: Order 3
                ────────────────────────────────────────────────────────── */}
            <div
              className={`lg:col-span-3 console-panel-card border-2 border-black p-4 flex flex-col h-[820px] order-3 lg:order-3 ${
                mobileTab === "copilot" ? "flex" : "hidden lg:flex"
              }`}
            >
            {/* Header with Mode indicator */}
            <div className="border-b-2 border-black pb-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF751F]" />
                  <h3 className="console-panel-header font-modular font-black uppercase" style={{ fontSize: "42px", letterSpacing: "0.12em", lineHeight: 1 }}>
                    COPILOT
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                  <span className="px-1.5 py-0.5 bg-[#00FFFF] border border-black text-black">
                    REASONING
                  </span>
                  <span className="px-1.5 py-0.5 bg-neutral-200 border border-black text-black">
                    CONTROL
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-neutral-500 mt-1 uppercase">
                ACTIVE FOCUS: <strong className="text-black">{selectedLead.name}</strong>
              </div>
            </div>

            {/* Quick Context Prompt Chips */}
            <div className="flex flex-wrap gap-1 mb-3">
              {[
                "Why should we call them?",
                "What evidence do we have?",
                "What did CALL-E verify?",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendCopilot(chip)}
                  className="text-[10px] font-mono bg-neutral-100 hover:bg-black hover:text-white border border-black px-2 py-1 transition-colors cursor-pointer text-left"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Transcript */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
              {copilotMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 border-2 ${
                    msg.role === "assistant"
                      ? "bg-neutral-50 border-black text-black"
                      : "bg-black text-[#00FFFF] border-black"
                  }`}
                >
                  <div className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-1">
                    {msg.role === "assistant" ? "DIAL O COPILOT" : "OPERATOR"}
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Prompt Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilot();
              }}
              className="mt-3 pt-3 border-t-2 border-black flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="p-2 border-2 border-black bg-neutral-100 hover:bg-neutral-200 transition-colors text-black"
                title="Attach context or documents"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Ask reason, score, or next action..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border-2 border-black bg-white placeholder-neutral-500 font-mono outline-none"
              />

              <button
                type="submit"
                className="p-2 border-2 border-black bg-[#EFCD5E] hover:bg-[#F8DA76] transition-colors text-black"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: EXPLAINABLE SCORE & EVIDENCE DOSSIER
          ══════════════════════════════════════════════════════════════ */}
      {inspectLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          role="dialog"
        >
          <div className="w-full max-w-xl bg-white border-4 border-black p-6 md:p-8 text-black relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            <button
              onClick={() => setInspectLead(null)}
              className="absolute top-5 right-5 text-neutral-500 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-black text-[#00FFFF] px-2.5 py-1">
                EVIDENCE & SCORING DOSSIER
              </span>
              <h3 className="text-2xl font-black uppercase tracking-wider text-black mt-3">
                {inspectLead.name}
              </h3>
              <p className="text-xs text-neutral-600 font-mono">
                {inspectLead.category} · {inspectLead.location}
              </p>
            </div>

            {/* 100-Point Scoring Model Breakdown */}
            <div className="mb-6">
              <div className="text-xs font-black uppercase tracking-wider mb-2 flex justify-between">
                <span>100-POINT EXPLAINABLE SCORING MODEL</span>
                <span className="text-[#FF751F]">{inspectLead.score} / 100 TOTAL</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-neutral-100 p-2.5 border border-black">
                  <span className="text-neutral-500 block text-[10px]">ICP FIT (max 25)</span>
                  <strong className="text-black">{inspectLead.scoreBreakdown.icpFit} pts</strong>
                </div>
                <div className="bg-neutral-100 p-2.5 border border-black">
                  <span className="text-neutral-500 block text-[10px]">BUSINESS QUALITY (max 15)</span>
                  <strong className="text-black">{inspectLead.scoreBreakdown.businessQuality} pts</strong>
                </div>
                <div className="bg-neutral-100 p-2.5 border border-black">
                  <span className="text-neutral-500 block text-[10px]">PAIN SIGNAL (max 25)</span>
                  <strong className="text-black">{inspectLead.scoreBreakdown.painSignal} pts</strong>
                </div>
                <div className="bg-neutral-100 p-2.5 border border-black">
                  <span className="text-neutral-500 block text-[10px]">INTENT (max 20)</span>
                  <strong className="text-black">{inspectLead.scoreBreakdown.intent} pts</strong>
                </div>
                <div className="bg-neutral-100 p-2.5 border border-black">
                  <span className="text-neutral-500 block text-[10px]">RECENCY (max 10)</span>
                  <strong className="text-black">{inspectLead.scoreBreakdown.recency} pts</strong>
                </div>
                <div className="bg-neutral-100 p-2.5 border border-black">
                  <span className="text-neutral-500 block text-[10px]">CONTACTABILITY (max 5)</span>
                  <strong className="text-black">{inspectLead.scoreBreakdown.contactability} pts</strong>
                </div>
              </div>
            </div>

            {/* Evidence List */}
            <div className="mb-6">
              <div className="text-xs font-black uppercase tracking-wider mb-2">
                VERIFIABLE EVIDENCE TRAIL
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {inspectLead.evidence.map((ev, i) => (
                  <div key={i} className="p-2.5 bg-neutral-50 border border-neutral-300 text-xs font-mono">
                    <span
                      className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 mr-2 border border-black ${
                        ev.type === "VERIFIED BY CALL"
                          ? "bg-[#00FFFF] text-black"
                          : ev.type === "OBSERVED"
                          ? "bg-neutral-200 text-black"
                          : "bg-[#EFCD5E] text-black"
                      }`}
                    >
                      {ev.type}
                    </span>
                    <span className="text-neutral-800 font-medium">{ev.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const target = inspectLead;
                setInspectLead(null);
                setSelectedLeadForCall(target);
              }}
              className="w-full bg-[#FF751F] hover:bg-[#ff893d] text-black font-black uppercase text-xs tracking-widest py-3 border-2 border-black flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_0_#000000]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>LAUNCH CALL-E ON THIS LEAD</span>
            </button>
          </div>
        </div>
      )}

      {/* CALL-E Call Simulator Modal */}
      <CallModal
        isOpen={!!selectedLeadForCall}
        lead={selectedLeadForCall}
        onClose={() => setSelectedLeadForCall(null)}
        onCallComplete={handleCallComplete}
      />

      {/* Document Ingestion Simulator Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onComplete={(criteria) => {
          setCopilotMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: `**Criteria Updated:** Ingested context for "${criteria}". 8 high-signal leads refreshed in the Lead Intelligence queue with target hypothesis signals.`,
            },
          ]);
        }}
      />
    </section>
  );
}
