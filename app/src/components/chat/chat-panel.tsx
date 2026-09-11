"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Upload,
  CheckCircle2,
  FileText,
  PhoneCall,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Sliders,
  Search
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

interface ChatPanelProps {
  taskId: string | null;
  selectedLeadId: string | null;
  onTaskCreated: (taskId: string) => void;
}

export function ChatPanel({
  taskId,
  selectedLeadId,
  onTaskCreated,
}: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "👋 Welcome! I am your **Autonomous Lead Copilot**.\n\nI can uncover qualified business prospects, extract buying criteria from your documents, break down AI scoring hypotheses, and coordinate **CALL-E voice qualification calls**.\n\nHow would you like to proceed?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
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
          id: `asst-${Date.now()}`,
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
          id: `asst-err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Error: ${errorMsg}. Please try again.`,
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
              id: `action-${Date.now()}`,
              role: "assistant",
              content: `🚀 **Research Task Started!** (Task ID: \`${data.data.taskId.slice(0, 8)}...\`)\n\nThe orchestrator is now discovering candidates, fetching multi-channel evidence, running scoring formulas, and preparing the pipeline. Watch the middle panel update live!`,
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
              id: `action-${Date.now()}`,
              role: "assistant",
              content: `📞 **CALL-E Voice Call Dispatched!**\n\nCall ID: \`${data.data.callId.slice(0, 8)}...\`\nStatus: \`${data.data.status}\`.\n\nThe AI voice agent will conduct a structured qualification dialog and report results to your Call Logs panel.`,
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
      sendMessage("Show current lead criteria and let me edit them");
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
            id: `doc-${Date.now()}`,
            role: "assistant",
            content: `📄 **Document Ingested: "${title}"**\n\nI have parsed the document and automatically synthesized new Ideal Customer Profile (ICP) criteria:\n• Industry: Medical, Dental, Healthcare Practices\n• Target Staff: 5-50 employees\n• Inferred Need: High after-hours missed calls, lack of bilingual reception\n\nWould you like me to run discovery against this newly extracted criteria?`,
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

  // Helper to render markdown-like formatted text simply
  const renderFormattedText = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      // Check if bullet list
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
    // Basic bold and code replacements
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1 py-0.5 rounded bg-slate-200/60 font-mono text-[11px] text-blue-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="panel flex flex-col h-full bg-slate-50/40">
      {/* Header */}
      <div className="panel-header flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              AI Copilot & Orchestrator
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Context-Aware Assistant</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDocUpload(!showDocUpload)}
            className={`btn btn-secondary btn-sm ${
              showDocUpload ? "bg-slate-200" : ""
            }`}
            title="Upload Business ICP Documents"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload ICP</span>
          </button>
        </div>
      </div>

      {/* Doc Upload Slide-down Drawer */}
      {showDocUpload && (
        <div className="p-4 bg-white border-b border-slate-200 animate-fade-in text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800">
              Ingest Business Criteria Document
            </span>
            <button
              onClick={() => setShowDocUpload(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-500 mb-3">
            Feed your ICP deck, sales battlecard, or service offering to calibrate the autonomous search agents:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDocumentUpload("PRODUCT_SPEC", "AI Receptionist Deck.pdf")}
              disabled={uploadingDoc}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-slate-800 truncate">AI Receptionist Deck</div>
                <div className="text-[10px] text-slate-400">Target dental / clinics</div>
              </div>
            </button>
            <button
              onClick={() => handleDocumentUpload("BATTLECARD", "Legal & Pro Services ICP.pdf")}
              disabled={uploadingDoc}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-slate-800 truncate">Legal Services ICP</div>
                <div className="text-[10px] text-slate-400">Boutique firms 10-50</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="panel-content p-4 space-y-3 flex-1 overflow-y-auto">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 animate-fade-in ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  isUser
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-xs"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                }`}
              >
                <div className="text-[11px] opacity-70 mb-1 flex items-center justify-between gap-4">
                  <span className="font-medium">{isUser ? "You" : "Lead Copilot"}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="text-xs">
                  {renderFormattedText(m.content)}
                </div>

                {/* Actions attached to message */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {m.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        onClick={() => handleAction(act)}
                        className="btn btn-primary btn-sm text-[11px] py-1 px-2.5 shadow-xs"
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
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
                <span className="text-xs text-slate-400 ml-1.5">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-200 bg-white/70 overflow-x-auto flex items-center gap-1.5 text-xs flex-shrink-0">
        <button
          onClick={() =>
            sendMessage(
              selectedLeadId
                ? "Why did this selected lead score high? Break down the evidence."
                : "Why did the top ranked lead score highest?"
            )
          }
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 whitespace-nowrap transition text-[11px]"
        >
          🔍 Explain Top Score
        </button>
        <button
          onClick={() => sendMessage("Show current lead criteria & target ICP rules")}
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 whitespace-nowrap transition text-[11px]"
        >
          🎯 Show Criteria
        </button>
        <button
          onClick={() =>
            sendMessage("Find 5 new dental practices in Austin needing phone automation")
          }
          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 whitespace-nowrap transition text-[11px]"
        >
          ⚡ Discover New Leads
        </button>
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              selectedLeadId
                ? "Ask about selected lead (e.g., 'Why call them?')..."
                : "Ask copilot, adjust criteria, or dispatch search..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-slate-50 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn btn-primary btn-sm px-3 py-2"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
