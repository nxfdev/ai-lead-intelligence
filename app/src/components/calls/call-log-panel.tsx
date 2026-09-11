"use client";

import { useQuery } from "@tanstack/react-query";
import { Phone, CheckCircle2, XCircle, Clock, ChevronRight, PhoneCall, History } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface CallLogPanelProps {
  onSelectLead: (leadId: string) => void;
}

interface CallData {
  id: string;
  status: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    location: string;
    category: string;
    score: number;
    qualification: string;
  };
  duration: number | null;
  completedAt: string | null;
  result: {
    summary: string;
    qualification: string;
    confidence: number;
  } | null;
  createdAt: string;
}

export function CallLogPanel({ onSelectLead }: CallLogPanelProps) {
  const { data: calls, isLoading } = useQuery<CallData[]>({
    queryKey: ["calls"],
    queryFn: async () => {
      const res = await fetch("/api/calls");
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 5000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <div className="w-7 h-7 rounded-lg bg-[#34f5c5]/12 border border-[#34f5c5]/30 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-[#34f5c5]" /></div>;
      case "FAILED":
        return <div className="w-7 h-7 rounded-lg bg-[#ff6b8a]/12 border border-[#ff6b8a]/30 flex items-center justify-center"><XCircle className="w-3.5 h-3.5 text-[#ff6b8a]" /></div>;
      case "IN_PROGRESS":
        return <div className="w-7 h-7 rounded-lg bg-[#7a52ff]/15 border border-[#7a52ff]/40 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-[#b094ff] animate-pulse" /></div>;
      default:
        return <div className="w-7 h-7 rounded-lg bg-white/6 border border-white/12 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-[#8f86a8]" /></div>;
    }
  };

  const getQualificationLabel = (qual: string | undefined) => {
    switch (qual) {
      case "qualified": return { label: "Verified", className: "status-badge verified" };
      case "not_qualified": return { label: "Not Qualified", className: "status-badge failed" };
      case "needs_follow_up": return { label: "Follow Up", className: "status-badge in-progress" };
      default: return { label: "Pending", className: "status-badge pending" };
    }
  };

  return (
    <div className="panel panel-collapsible animate-fade-in" style={{ animationDelay: "0.05s" }}>
      <div className="panel-header flex items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5fa2]/25 to-[#6c5bff]/25 border border-white/12 flex items-center justify-center">
            <History className="w-4 h-4 text-[#ff9ecb]" />
          </div>
          <div>
            <h2>Call Logs</h2>
            <span className="text-[10px] text-[#7c7199] mt-0.5 block">
              CALL-E voice qualification
            </span>
          </div>
        </div>
        <div className="glass rounded-full px-2.5 py-1 text-[11px] font-bold text-[#b094ff]">
          {calls?.length || 0}
        </div>
      </div>
      <hr className="panel-divider" />
      <div className="panel-content">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-[#7a52ff]/30 border-t-[#d23cff] animate-spin" />
            <div className="text-xs text-[#7c7199] mt-3">Summoning call logs...</div>
          </div>
        ) : !calls || calls.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#7a52ff]/15 to-[#ff5fa2]/15 border border-white/10 flex items-center justify-center mb-4">
              <PhoneCall className="w-7 h-7 text-[#7c7199]" />
            </div>
            <p className="text-sm font-semibold text-[#c9c0e6]">No calls yet</p>
            <p className="text-xs text-[#7c7199] mt-1.5 leading-relaxed">
              Select a lead and dispatch the AI voice agent
            </p>
          </div>
        ) : (
          <div>
            {calls.map((call) => {
              const qual = getQualificationLabel(call.result?.qualification);
              return (
                <div
                  key={call.id}
                  className="call-log-item animate-fade-in"
                  onClick={() => onSelectLead(call.lead.id)}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(call.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-white truncate">
                          {call.lead.name}
                        </span>
                        <ChevronRight className="w-3 h-3 text-[#4a3f68] flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={qual.className}>{qual.label}</span>
                        {call.duration && (
                          <span className="text-[10px] text-[#8f86a8] font-medium">
                            {call.duration}s
                          </span>
                        )}
                      </div>

                      {call.result?.summary && (
                        <p className="text-[11px] text-[#b9aed8] line-clamp-2 leading-relaxed">
                          {call.result.summary.substring(0, 120)}
                          {call.result.summary.length > 120 ? "..." : ""}
                        </p>
                      )}

                      <div className="mt-2 text-[10px] text-[#6a5f86]">
                        {formatTimeAgo(call.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}