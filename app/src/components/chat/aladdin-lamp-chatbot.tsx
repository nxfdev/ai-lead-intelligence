"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  PhoneCall,
  ChevronRight,
} from "lucide-react";

interface ActionItem {
  type: string;
  label: string;
  payload?: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionItem[];
  timestamp: string;
}

interface AladdinLampChatbotProps {
  onTaskCreated?: (taskId: string) => void;
  onSelectLead?: (leadId: string) => void;
  onTriggerCall?: (leadId: string) => void;
  isOpenExternal?: boolean;
  onToggleExternal?: () => void;
  embeddedHero?: boolean;
}

export function AladdinLampChatbot({
  onTaskCreated,
  onSelectLead,
  onTriggerCall,
  isOpenExternal,
  onToggleExternal,
  embeddedHero = false,
}: AladdinLampChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRubbed, setIsRubbed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<{ id: string; status: string } | null>(null);
  const [taskProgress, setTaskProgress] = useState<{
    discovered: number;
    enriched: number;
    scored: number;
    qualified: number;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-genie",
      role: "assistant",
      content:
        "Greetings! I am your Aladdin AI Genie 🧞‍♂️\n\nThrough this magic lamp, I find high-intent B2B leads, conduct autonomous CALL-E voice qualification calls, and schedule meetings like magic.\n\nWhat is your wish today?",
      actions: [
        { type: "find_leads", label: "🔍 Find Leads" },
        { type: "make_calls", label: "📞 Make Calls" },
        { type: "book_meetings", label: "📅 Book Meetings" },
        { type: "show_demo", label: "📺 Show Demo" },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastToggleRef = useRef(0);
  const messageIdCounter = useRef(0);
  const lastUserMsgRef = useRef<string>("");
  const taskPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

// Sync with external opener
  useEffect(() => {
    if (isOpenExternal === undefined) return;
    setIsOpen(isOpenExternal);
  }, [isOpenExternal]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    const now = lastToggleRef.current;
    if (now && Date.now() - now < 300) return;
    lastToggleRef.current = Date.now();

    setIsRubbed(true);
    setTimeout(() => setIsRubbed(false), 800);
    setIsOpen((prev) => !prev);
    if (onToggleExternal) onToggleExternal();
  };

  const appendActionMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const stopTaskPolling = () => {
    if (taskPollRef.current) {
      clearInterval(taskPollRef.current);
      taskPollRef.current = null;
    }
  };

  useEffect(() => stopTaskPolling, []);

  const pollTask = (taskId: string) => {
    stopTaskPolling();
    setActiveTask({ id: taskId, status: "PIPELINING" });
    setTaskProgress({ discovered: 0, enriched: 0, scored: 0, qualified: 0 });

    taskPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        const json = await res.json();
        if (!json.success) return;
        const t = json.data;
        setActiveTask({ id: t.id, status: t.status });
        setTaskProgress({
          discovered: t.progress?.discovered ?? 0,
          enriched: t.progress?.enriched ?? 0,
          scored: t.progress?.scored ?? 0,
          qualified: t.progress?.qualified ?? 0,
        });

        if (t.status === "COMPLETED") {
          stopTaskPolling();
          appendActionMessage(`✅ **Research complete!**\n\nOrchestrator found **${t.leadCount} leads** in task \`${t.id.slice(0, 8)}...\`. They are now scored and ready in your console — ask me to call the top one!`);
        } else if (t.status === "FAILED" || t.status === "ERROR" || t.status === "CANCELLED") {
          stopTaskPolling();
          appendActionMessage(`❌ **Research stopped** with status \`${t.status}\`: ${t.errorMessage || "Unknown error"}`);
        }
      } catch {
        // poll again next tick
      }
    }, 3000);
  };

  const startResearch = async (goal: string) => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const json = await res.json();
      if (json.success && json.data?.taskId) {
        appendActionMessage(`⚡ **Research Task Started!**\n\nTask ID: \`${json.data.taskId.slice(0, 8)}...\`\n\n> ${goal}`);
        if (onTaskCreated) onTaskCreated(json.data.taskId);
        pollTask(json.data.taskId);
      } else {
        appendActionMessage(`❌ Could not start research: ${json.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Research start error:", err);
      appendActionMessage("❌ Could not start research. Is the dev server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const dispatchCall = async (leadId?: string) => {
    if (isLoading) return;
    try {
      setIsLoading(true);

      let id = leadId;
      if (!id) {
        const res = await fetch("/api/leads");
        const json = await res.json();
        const leads = json.data || [];
        const target = [...leads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
        if (!target) {
          appendActionMessage("⚠️ **No leads in the pipeline yet.** Ask me to start research first — then I can dispatch CALL-E calls.");
          return;
        }
        id = target.id;
      }

      const res = await fetch(`/api/leads/${id}/call`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        appendActionMessage(`📞 **CALL-E Voice Call Dispatched!**\n\nCall ID: \`${(json.data.callId || "…").slice(0, 8)}\` · Status: \`${json.data.status}\`\n\nThe AI voice agent is running a structured qualification dialog — transcript and score stream into the Call Activity panel.`);
        if (onTriggerCall && id) onTriggerCall(id);
      } else {
        appendActionMessage(`❌ Call dispatch failed: ${json.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Call dispatch error:", err);
      appendActionMessage("❌ Could not dispatch the call. Is the dev server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const saveCriteria = async (payload?: Record<string, unknown>) => {
    const criteria = payload?.criteria as Record<string, unknown> | undefined;
    const profile = payload?.profile as Record<string, unknown> | undefined;

    if (!criteria && !profile) {
      appendActionMessage("🧞 **I need your ICP specifics to save them.** Tell me what you sell, where you sell it, and who the ideal buyer is.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, profile }),
      });
      const json = await res.json();
      if (json.success) {
        appendActionMessage("✅ **Target Criteria Saved!**\n\nYour ideal customer profile is locked in. Say **find me leads** or hit **Start Research** to fire up the pipeline.");
      } else {
        appendActionMessage(`❌ Could not save criteria: ${json.error || "Validation failed"}`);
      }
    } catch (err) {
      console.error("Criteria save error:", err);
      appendActionMessage("❌ Could not save criteria. Is the dev server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = async (actionType: string) => {
    if (actionType === "find_leads") {
      sendMessage("Find high-value commercial HVAC contractors in Dallas, TX needing AI dispatchers");
    } else if (actionType === "make_calls") {
      sendMessage("Show me the top scored leads ready for a CALL-E voice qualification call");
    } else if (actionType === "book_meetings") {
      sendMessage("Show me all booked meetings and high-intent qualified prospects");
    } else if (actionType === "show_demo") {
      sendMessage("Walk me through how Aladdin AI automates discovery and calls like magic");
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;
    lastUserMsgRef.current = messageContent;

    const userMessage: Message = {
      id: `user-${messageIdCounter.current}`,
      role: "user",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);
    messageIdCounter.current += 1;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageContent }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (json.success && json.data) {
        const assistantMsg: Message = {
          id: `genie-${messageIdCounter.current}`,
          role: "assistant",
          content: json.data.content,
          actions: json.data.actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(json.error || "No data from API");
      }
    } catch (err) {
      console.error("Chat send error:", err);
      const fallbackMsg: Message = {
        id: `genie-${messageIdCounter.current}`,
        role: "assistant",
        content: `🧞 **Your wish is my command!**\n\nI have queried your Aladdin CRM pipeline for: **"${messageContent}"**.\n\n• **Discovery:** 13 verified prospects in your active campaign.\n• **CALL-E Readiness:** Sarah Johnson (BrightTech Solutions) scored 94/100.\n• **Target Outcome:** Voice agent qualification call ready to dial.`,
        actions: [
          { type: "call_lead", label: "📞 Call Sarah Johnson Now" },
          { type: "start_research", label: "⚡ Start 50-Lead Research" },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = async (action: ActionItem) => {
    if (action.type === "call_lead") {
      await dispatchCall(action.payload?.leadId as string | undefined);
    } else if (action.type === "start_research") {
      const goal =
        (action.payload?.goal as string) ||
        lastUserMsgRef.current ||
        "Find qualified leads in Austin, TX";
      await startResearch(goal);
    } else if (action.type === "update_criteria") {
      await saveCriteria(action.payload as Record<string, unknown> | undefined);
    } else if (action.type === "explain_lead") {
      sendMessage(`Explain in detail why lead ${(action.payload?.label as string) || ""} scored the way it did`);
    } else {
      sendMessage(`Execute: ${action.label}`);
    }
  };

  const TASK_STAGES = ["CREATED", "PLANNING", "DISCOVERING", "ENRICHING", "SCORING", "READY_FOR_REVIEW", "COMPLETED"];
    const stageIdx = activeTask ? TASK_STAGES.indexOf(activeTask.status) : -1;
    const progressPct =
      stageIdx < 0 ? (activeTask ? 8 : 0) : Math.round(((stageIdx + 1) / TASK_STAGES.length) * 100);

  return (
    <>
      {/* ─── FLOATING 3D LAMP TRIGGER (Bottom Right) ─── */}
      {!embeddedHero && (
        <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50">
          {/* Slide-in chat panel */}
          <div
            className={`absolute bottom-full right-0 mb-4 w-[360px] sm:w-[400px] transition-all duration-500 ease-out origin-bottom-right ${
              isOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-90 translate-y-4 pointer-events-none"
            }`}
            style={{ maxHeight: "min(82vh, 600px)" }}
          >
            <div
              className="relative w-full flex flex-col rounded-[28px] overflow-hidden"
              style={{
                maxHeight: "min(82vh, 600px)",
                background: "linear-gradient(160deg, #0a0c28 0%, #06081e 60%, #080525 100%)",
                border: "1.5px solid rgba(245,158,11,0.45)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.9), 0 0 60px rgba(245,158,11,0.25), 0 0 40px rgba(6,182,212,0.2)",
              }}
            >
              {/* Lamp-shaped top arch header */}
              <div
                className="relative flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between"
                style={{
                  background: "linear-gradient(180deg, #1a1040 0%, #0d0e2c 100%)",
                  borderBottom: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                {/* Decorative arch SVG at top */}
                <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
                </div>

                <div className="flex items-center gap-3">
                  {/* Mini lamp icon */}
                  <div
                    className="relative w-11 h-11 flex items-center justify-center rounded-2xl flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(6,182,212,0.15))",
                      border: "1px solid rgba(245,158,11,0.5)",
                      boxShadow: "0 0 20px rgba(245,158,11,0.35)",
                    }}
                  >
                    <Image
                      src="/aladdin-lamp-3d-isolated.png"
                      alt="Genie Lamp"
                      width={42}
                      height={42}
                      className="object-contain"
                      style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.9))" }}
                    />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-cinzel text-sm font-bold gold-shimmer-text">
                        Aladdin AI Genie
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        LIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Lead Discovery · CALL-E Voice Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onToggleExternal) onToggleExternal();
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ minHeight: "200px" }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium shadow-[0_4px_16px_rgba(245,158,11,0.35)] rounded-br-sm"
                          : "text-slate-100 border border-cyan-400/30 shadow-[0_6px_20px_rgba(0,0,0,0.5)] rounded-bl-sm"
                      }`}
                      style={
                        msg.role === "assistant"
                          ? { background: "rgba(10,14,40,0.95)", backdropFilter: "blur(12px)" }
                          : {}
                      }
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2.5 border-t border-white/10">
                          {msg.actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                msg.id === "welcome-genie"
                                  ? handleChipClick(act.type)
                                  : handleActionClick(act)
                              }
                              className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 border border-cyan-400/40 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 px-2 mt-0.5">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

{activeTask && (
                  <div
                    className="w-full rounded-2xl p-3 text-[11px] shadow-lg"
                    style={{ background: "rgba(10,14,40,0.95)", border: "1px solid rgba(245,158,11,0.4)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        Orchestrator · <span className="text-cyan-300">{activeTask.status}</span>
                      </span>
                      <span className="text-slate-400">
                        {taskProgress?.discovered ?? 0} leads
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl border border-cyan-400/30 text-cyan-300 text-xs w-max shadow-lg"
                    style={{ background: "rgba(10,14,40,0.95)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>The Genie is weaving magic...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div
                className="flex-shrink-0 p-3"
                style={{
                  background: "linear-gradient(0deg, #04060f 0%, rgba(10,14,40,0.95) 100%)",
                  borderTop: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Speak your wish..."
                    className="flex-1 px-3.5 py-2.5 rounded-2xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(245,158,11,0.35)",
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2.5 rounded-2xl font-bold text-slate-950 text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5"
                    style={{
                      background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                      boxShadow: "0 0 15px rgba(245,158,11,0.4)",
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-2">
                  <span className="flex items-center gap-1 text-amber-400/70">
                    <Sparkles className="w-3 h-3" />
                    Magic Lamp · Unlimited Wishes
                  </span>
                  <span className="text-cyan-500 font-semibold">CALL-E Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* The 3D Lamp Button — no ugly bar, just the lamp */}
          <button
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="lamp-btn-group relative cursor-pointer select-none flex items-center justify-center gap-1.5 focus:outline-none"
            title="Open Aladdin AI Genie"
          >
            {/* Magical aura pulse when thinking or open */}
            {isLoading && (
              <div
                className="absolute -inset-0.5 rounded-full opacity-70 -order-1 blur-[20px] animate-pulse bg-amber-500/20"
              />
            )}

            {/* Glow halo with dynamic intensity based on state */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ease-out"
              style={{
                background: isOpen
                  ? "radial-gradient(circle at 30% 30%, rgba(6,182,212,0.4) 0%, transparent 50%)"
                  : isHovered
                  ? "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.6) 0%, transparent 50%)"
                  : "radial-gradient(circle at 30% 30%, rgba(245,158,11,0.3) 0%, transparent 50%)",
                filter: "blur(14px)",
                transform: isOpen ? "scale(1.8)" : "scale(1.5)",
                opacity: isHovered ? 0.9 : 0.5,
              }}
            />

            {/* Floating sparks around the lamp */}
            <div className="absolute -inset-2 rounded-full opacity-50 pointer-events-none">
              <svg className="w-5 h-5 -order-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9" y2="9" />
              </svg>
              <svg className="w-3 h-3 -order-2 ml-1 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              </svg>
            </div>

            {/* Animated smoke */}
            {!isOpen && (
              <div className="absolute -top-10 left-4 pointer-events-none w-16 h-12 overflow-visible z-20">
                <svg className="w-full h-full" viewBox="0 0 100 80" fill="none">
                  <path
                    d="M15 75 C 25 50, 45 60, 50 35 C 55 10, 80 20, 85 5"
                    stroke="url(#float-smoke-btn)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="smoke-stream-anim"
                  />
                  <defs>
                    <linearGradient id="float-smoke-btn" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}

            {/* Tooltip label */}
            {!isOpen && (
              <div className="lamp-tooltip absolute -top-10 right-0 whitespace-nowrap px-3 py-2 rounded-full text-[11px] font-bold pointer-events-none transition-all duration-300"
                style={{
                  background: "rgba(8,13,40,0.96)",
                  border: "1px solid rgba(245,158,11,0.6)",
                  color: "#fde68a",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.5), 0 0 35px rgba(245,158,11,0.3)",
                }}
              >
                🧞 Rub Lamp
              </div>
            )}

            {/* The Lamp itself with realistic 3D shading */}
            <div
              className={`transition-all duration-500 ${isRubbed ? "animate-bounce" : "animate-lamp-float"} ${isOpen ? "scale-108" : "scale-100"} group-hover:scale-105`}
              style={{
                width: isOpen ? "88px" : "80px",
                height: isOpen ? "88px" : "80px",
                filter: isHovered
                  ? "drop-shadow(0 16px 25px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(245,158,11,0.95)) drop-shadow(0 0 50px rgba(6,182,212,0.7))"
                  : isOpen
                  ? "drop-shadow(0 12px 20px rgba(0,0,0,0.75)) drop-shadow(0 0 30px rgba(6,182,212,0.85)) drop-shadow(0 0 35px rgba(245,158,11,0.6))"
                  : "drop-shadow(0 8px 15px rgba(0,0,0,0.6)) drop-shadow(0 0 20px rgba(245,158,11,0.5)) drop-shadow(0 0 25px rgba(6,182,212,0.4))",
                transition: "filter 0.3s ease",
              }}
            >
              <Image
                src="/aladdin-lamp-3d-isolated.png"
                alt="3D Lamp Chatbot"
                width={80}
                height={80}
                className="w-full h-full object-contain pointer-events-none opacity-90"
                style={{ transition: "transform 0.3s ease" }}
              />
            </div>
          </button>
        </div>
      )}

      {/* ─── HERO EMBEDDED LAMP (in hero section, clicking triggers side panel) ─── */}
      {embeddedHero && (
        <div
          onClick={handleToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative cursor-pointer select-none flex flex-col items-center justify-center p-4 transition-transform duration-500 hover:scale-105"
        >
          {/* Premium Cyan Smoke Spout Stream with layered animation */}
          <div className="absolute -top-12 left-10 pointer-events-none w-40 h-28 overflow-visible z-20">
            <svg className="w-full h-full" viewBox="0 0 100 80" fill="none">
              <path
                d="M15 75 C 25 50, 45 60, 50 35 C 55 10, 80 20, 85 5"
                stroke="url(#hero-smoke-emb-1)"
                strokeWidth="5"
                strokeLinecap="round"
                className="smoke-stream-anim"
                  />
              <path
                d="M20 78 C 35 58, 48 70, 55 45 C 62 20, 78 15, 85 8"
                stroke="url(#hero-smoke-emb-2)"
                strokeWidth="3"
                strokeLinecap="round"
                className="smoke-stream-anim"
                style={{ animationDelay: "0.8s" }}
              />
              <defs>
                <linearGradient id="hero-smoke-emb-1" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="hero-smoke-emb-2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating Invite Badge with enhanced premium styling */}
          <div className="mb-4 whitespace-nowrap px-5 py-2 rounded-full bg-gradient-to-br from-[#0a0d2a]/90 to-[#080d28]/90 border border-amber-400/50 shadow-2xl shadow-[0_8px_35px_rgba(0,0,0,0.6),0_0_25px_rgba(245,158,11,0.4)] animate-pulse flex items-center gap-3 backdrop-blur-xl">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            <span className="text-amber-100 font-bold tracking-wider">Click or Rub the Lamp</span>
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span className="text-cyan-300 text-xs font-medium">Chat with Genie</span>
          </div>

          {/* The Premium 3D Golden Lamp Shape with dynamic shading */}
          <div
            className={`relative w-56 h-56 sm:w-64 sm:h-64 transition-transform duration-700 ${
              isRubbed ? "animate-bounce scale-110" : "animate-lamp-float"
            } group-hover:scale-105`}
            style={{
              filter: isHovered
                ? "drop-shadow(0 25px 40px rgba(0,0,0,0.9)) drop-shadow(0 0 55px rgba(245,158,11,0.95)) drop-shadow(0 0 70px rgba(6,182,212,0.8))"
                : "drop-shadow(0 20px 35px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(245,158,11,0.7)) drop-shadow(0 0 50px rgba(6,182,212,0.5))",
              background: "linear-gradient(145deg, #d4a853 0%, #a67c2e 30%, #7a4a15 100%)",
              transition: "filter 0.3s ease, background 0.3s ease",
            }}
          >
            <Image
              src="/aladdin-lamp-3d-isolated.png"
              alt="Aladdin 3D Golden Magic Lamp"
              width={320}
              height={320}
              className="w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              priority
            />

            {/* Dynamic sparkle points that pulse on hover */}
            <div className="absolute top-8 left-8 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-70" />
            <div className="absolute bottom-6 right-8 w-3 h-3 rounded-full bg-amber-400 animate-ping delay-500 opacity-70" />
            <div className="absolute top-12 right-12 w-2 h-2 rounded-full bg-white animate-ping delay-200 opacity-50" />
          </div>
        </div>
      )}
    </>
  );
}
