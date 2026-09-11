"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Sparkles,
  Paperclip,
  FileText,
  PhoneCall,
  Sliders,
  User,
  X,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AIAvatar } from "@/components/ai-avatar";

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

interface ChatPanelProps {
  taskId: string | null;
  selectedLeadId: string | null;
  onTaskCreated: (taskId: string) => void;
  onActive?: () => void;
}

export function ChatPanel({ taskId, selectedLeadId, onTaskCreated, onActive }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Welcome! I'm **LUMI**, your autonomous female AI Lead Merchant.\n\nI can uncover qualified business prospects, extract buying criteria from your documents, break down AI scoring hypotheses, and coordinate **CALL-E voice qualification calls**.\n\nHow would you like to proceed?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [active, setActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);
  const [hasCriteria, setHasCriteria] = useState(true);
  const onboardingSuggestions = [
    "I sell AI phone receptionists for dental clinics in Austin, TX",
    "Find plumbing businesses in Houston needing after-hours call handling",
    "Law firms in Dallas with 20+ staff for legal intake software",
  ];

  useEffect(() => {
    let cancelled = false;
    fetch("/api/criteria")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success && !d.data?.criteria) setHasCriteria(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const nextMessageId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const markActive = () => {
    if (!active) {
      setActive(true);
      onActive?.();
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    markActive();

    const userMessage: Message = {
      id: nextMessageId("user"),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          taskId: taskId || undefined,
          leadId: selectedLeadId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const assistantMessage: Message = {
          id: nextMessageId("asst"),
          role: "assistant",
          content: data.data.content,
          actions: data.data.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed to get AI response");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId("asst-err"),
          role: "assistant",
          content: `Error: ${errorMsg}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: ActionItem) => {
    if (action.type === "start_research") {
      const goal = (action.payload?.goal as string) || "Find qualified leads in Austin, TX";
      try {
        setIsLoading(true);
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal }),
        });
        const data = await res.json();
        if (data.success) {
          onTaskCreated(data.data.taskId);
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId("action"),
              role: "assistant",
              content: `**Research Task Started!** (Task ID: \`${data.data.taskId.slice(0, 8)}...\`)\n\nThe orchestrator is now discovering candidates, fetching multi-channel evidence, running scoring formulas, and preparing the pipeline. Watch the pipeline panel update live!`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      } catch (err) {
        console.error("Task start error:", err);
      } finally {
        setIsLoading(false);
      }
    } else if (action.type === "call_lead") {
      const leadId = (action.payload?.leadId as string) || selectedLeadId;
      if (!leadId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/leads/${leadId}/call`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId("action"),
              role: "assistant",
              content: `**CALL-E Voice Call Dispatched!**\n\nCall ID: \`${data.data.callId.slice(0, 8)}...\`\nStatus: \`${data.data.status}\`.\n\nThe AI voice agent will conduct a structured qualification dialog and report results to your Call Logs panel.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          queryClient.invalidateQueries({ queryKey: ["calls"] });
        }
      } catch (err) {
        console.error("Call dispatch error:", err);
      } finally {
        setIsLoading(false);
      }
    } else if (action.type === "update_criteria") {
      await handleUpdateCriteria(action.payload as Record<string, unknown> | undefined);
    }
  };

  const handleUpdateCriteria = async (payload?: Record<string, unknown>) => {
    const newCriteria = payload?.criteria as Record<string, unknown> | undefined;
    const newProfile = payload?.profile as Record<string, unknown> | undefined;

    try {
      setIsLoading(true);

      if (newCriteria || newProfile) {
        const res = await fetch("/api/criteria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria: newCriteria, profile: newProfile }),
        });
        const data = await res.json();

        if (data.success) {
          setHasCriteria(true);
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId("criteria"),
              role: "assistant",
              content:
                "**Target Criteria Saved!**\n\nYour ideal customer profile is now locked in. Ask me to **discover leads** or hit the Start Research action to begin scraping real prospects from Google Maps, web search, and directories.",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      } else {
        const res = await fetch("/api/criteria");
        const data = await res.json();
        const c = data?.data?.criteria as Record<string, unknown> | undefined;
        if (data.success && c) setHasCriteria(true);

        const summary = c
          ? [
              `**Current Lead Criteria**`,
              `- Industry: ${((c.industry as string[]) || []).join(", ") || "Not set"}`,
              `- Location: ${(c.location as Record<string, unknown>)?.city || "Not set"}, ${(c.location as Record<string, unknown>)?.state || ""} (${(c.location as Record<string, unknown>)?.radiusMiles || "?"} mi)`,
              `- Employees: ${c.minEmployees ?? "?"}–${c.maxEmployees ?? "?"}`,
              `- Required signals: ${((c.requiredSignals as string[]) || []).join(", ") || "None"}`,
              `- Excluded: ${((c.excluded as string[]) || []).join(", ") || "None"}`,
            ].join("\n")
          : "**No criteria saved yet.** Tell me what you sell and where, and I'll capture your target profile.";

        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId("criteria"),
            role: "assistant",
            content: summary,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Criteria save error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId("criteria-err"),
          role: "assistant",
          content: "I ran into a problem saving the criteria. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (docType: string, title: string) => {
    setUploadingDoc(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: docType,
          content: `Company product overview and ideal customer profile guidelines for ${title}. Target medical/dental businesses with 5-50 employees seeking automated front-desk scheduling solutions.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadedDocName(title);
        setShowDocUpload(false);
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId("doc"),
            role: "assistant",
            content: `**Document Ingested: "${title}"**\n\nI have parsed the document and automatically synthesized new Ideal Customer Profile (ICP) criteria:\n• Industry: Medical, Dental, Healthcare Practices\n• Target Staff: 5-50 employees\n• Inferred Need: High after-hours missed calls, lack of bilingual reception\n\nWould you like me to run discovery against this newly extracted criteria?`,
            actions: [
              {
                type: "start_research",
                label: "Run Discovery for this ICP",
                payload: { goal: `Find medical & dental clinics in Austin based on ${title}` },
              },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Doc upload error:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const renderFormattedText = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      if (block.includes("• ") || block.startsWith("- ")) {
        const lines = block.split("\n");
        return (
          <ul key={i} className="list-disc list-inside space-y-1 my-2">
            {lines.map((line, liIdx) => {
              const cleanLine = line.replace(/^[•\-]\s*/, "");
              return (
                <li key={liIdx} className="leading-relaxed">
                  {renderInlineFormatting(cleanLine)}
                </li>
              );
            })}
          </ul>
        );
      }
      return (
        <p key={i} className="mb-2 last:mb-0 leading-relaxed">
          {renderInlineFormatting(block)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-[#7a52ff]/20 font-mono text-[10.5px] text-[#c7b6ff] border border-[#7a52ff]/25"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`panel chat-col relative flex flex-col h-full transition-all duration-500 ${active ? "border-gradient" : ""}`}
    >
      {/* Header */}
      <div className="panel-header flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <AIAvatar size={expanded ? 48 : 40} />
          <div>
            <h2 className="text-[12.5px] tracking-[0.12em]">
              <span className="gradient-text font-extrabold">LUMI</span>{" "}
              <span className="text-[#b9aed8]">· AI Lead Merchant</span>
            </h2>
            <div className="flex items-center gap-1.5 text-[10.5px] text-[#8f86a8] mt-0.5">
              {isLoading ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffc85c] pulse-dot" />
                  <span className="text-[#ffc85c]">Negotiating insight...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34f5c5] pulse-dot" />
                  <span>Context-Aware · {active ? "In session" : "Idle"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDocUpload(!showDocUpload)}
            className="btn btn-secondary btn-sm"
            title="Upload ICP documents to calibrate the autonomous merchant"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload ICP</span>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-sm p-1.5"
            title={expanded ? "Minimize panel" : "Expand panel"}
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <hr className="panel-divider" />

      {/* Doc Upload Drawer */}
      {showDocUpload && (
        <div className="glass mx-3 mt-2 rounded-2xl p-4 animate-fade-in-scale text-xs flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white">
              Ingest Business Criteria Document
            </span>
            <button
              onClick={() => setShowDocUpload(false)}
              className="text-[#7c7199] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[#b9aed8] mb-3">
            Feed your ICP deck, sales battlecard, or service offering to calibrate the
            autonomous search agents:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDocumentUpload("PRODUCT_SPEC", "AI Receptionist Deck.pdf")}
              disabled={uploadingDoc}
              className="p-2.5 rounded-xl bg-white/[0.05] border border-white/12 hover:border-[#7a52ff]/50 hover:bg-[#7a52ff]/10 text-left transition flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-[#7a52ff]/20 border border-[#7a52ff]/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#b094ff]" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-white text-[11px] truncate">AI Receptionist Deck</div>
                <div className="text-[9.5px] text-[#8f86a8]">Target dental / clinics</div>
              </div>
            </button>
            <button
              onClick={() => handleDocumentUpload("BATTLECARD", "Legal & Pro Services ICP.pdf")}
              disabled={uploadingDoc}
              className="p-2.5 rounded-xl bg-white/[0.05] border border-white/12 hover:border-[#7a52ff]/50 hover:bg-[#7a52ff]/10 text-left transition flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-[#ff5fa2]/15 border border-[#ff5fa2]/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#ff9ecb]" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-white text-[11px] truncate">Legal Services ICP</div>
                <div className="text-[9.5px] text-[#8f86a8]">Boutique firms 10-50</div>
              </div>
            </button>
          </div>
          {uploadedDocName && (
            <div className="mt-3 flex items-center gap-2 text-[#34f5c5] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34f5c5]" />
              Ingested: {uploadedDocName}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={`panel-content px-3 py-2 ${active ? "text-[13.5px]" : ""}`}>
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex-shrink-0 ${expanded ? "mt-1" : ""}`}
              >
                {isUser ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff5fa2] to-[#6c5bff] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(210,60,255,0.4)]">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <AIAvatar size={28} animated={false} />
                )}
              </div>

              <div
                className={`${isUser ? "chat-message user" : "chat-message assistant"} ${
                  active ? "!max-w-[92%]" : ""
                }`}
              >
                <div className="text-[10.5px] opacity-70 mb-1 flex items-center justify-between gap-4">
                  <span className="font-medium">{isUser ? "You" : "LUMI"}</span>
                  <span suppressHydrationWarning>{m.timestamp}</span>
                </div>

                <div>{renderFormattedText(m.content)}</div>

                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                    {m.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        onClick={() => handleAction(act)}
                        className="btn btn-primary btn-sm"
                      >
                        {act.type === "call_lead" && <PhoneCall className="w-3 h-3" />}
                        {act.type === "start_research" && <Sparkles className="w-3 h-3" />}
                        {act.type === "update_criteria" && <Sliders className="w-3 h-3" />}
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 animate-fade-in">
            <AIAvatar size={28} animated={false} />
            <div className="glass rounded-2xl rounded-tl-6px px-4 py-3 flex items-center gap-2">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="text-[11px] text-[#8f86a8] ml-1.5">LUMI is negotiating...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Onboarding chips */}
      {!hasCriteria && (
        <div className="px-3 flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#8f86a8] pr-0.5">
            Set your target:
          </span>
          {onboardingSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                markActive();
                sendMessage(s);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#7a52ff]/10 hover:bg-[#7a52ff]/20 border border-[#7a52ff]/30 text-[#d6caff] hover:border-[#7a52ff]/60 whitespace-nowrap transition text-[11px] font-medium"
            >
              <Sliders className="w-3 h-3 text-[#b094ff]" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick prompts */}
      <div className="px-3 py-2 overflow-x-auto flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => {
            markActive();
            sendMessage(
              selectedLeadId
                ? "Why did this selected lead score high? Break down the evidence."
                : "Why did the top ranked lead score highest?"
            );
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] hover:border-[#7a52ff]/40 text-[#c9c0e6] border border-white/10 whitespace-nowrap transition text-[11px] font-medium"
        >
          <Sparkles className="w-3 h-3 text-[#ffd58a]" />
          Explain Top Score
        </button>
        <button
          onClick={() => {
            markActive();
            sendMessage("Show current lead criteria & target ICP rules");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] hover:border-[#7a52ff]/40 text-[#c9c0e6] border border-white/10 whitespace-nowrap transition text-[11px] font-medium"
        >
          <Sliders className="w-3 h-3 text-[#b094ff]" />
          Show Criteria
        </button>
        <button
          onClick={() => {
            markActive();
            sendMessage("Find 5 new dental practices in Austin needing phone automation");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] hover:border-[#7a52ff]/40 text-[#c9c0e6] border border-white/10 whitespace-nowrap transition text-[11px] font-medium"
        >
          <Sparkles className="w-3 h-3 text-[#ff9ecb]" />
          Discover New Leads
        </button>
      </div>

      {/* Input bar */}
      <div className="px-3 pb-3 pt-0.5 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="border-gradient rounded-2xl p-[1px]"
        >
          <div className="glass-strong rounded-2xl flex items-center gap-2 p-1.5">
            <input
              type="text"
              placeholder={
                selectedLeadId
                  ? "Ask about selected lead (e.g., 'Why call them?')..."
                  : "Command LUMI: discover, score, explain, call..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={markActive}
              disabled={isLoading}
              className="flex-1 text-xs px-3 py-2 bg-transparent focus:outline-none placeholder-[#6a5f86]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn btn-primary btn-sm px-3 py-2"
              title="Send command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        <div className="flex items-center justify-center gap-1 text-[9.5px] text-[#4a3f68] mt-2">
          <ChevronDown className="w-2.5 h-2.5" />
          LUMI orchestrates research, scoring & CALL-E voice outreach
        </div>
      </div>
    </div>
  );
}