"use client";

import { useQuery } from "@tanstack/react-query";
import { Phone, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
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
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case "IN_PROGRESS":
        return <Phone className="w-3.5 h-3.5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
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
    <div className="panel">
      <div className="panel-header flex items-center justify-between">
        <h2>Call Logs</h2>
        <span className="text-xs text-slate-400 font-medium">
          {calls?.length || 0} calls
        </span>
      </div>
      <div className="panel-content">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="text-sm text-slate-400">Loading calls...</div>
          </div>
        ) : !calls || calls.length === 0 ? (
          <div className="p-6 text-center">
            <Phone className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No calls yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Select a lead and click "Call" to start
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
                    <div className="mt-0.5">{getStatusIcon(call.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {call.lead.name}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className={qual.className}>{qual.label}</span>
                        {call.duration && (
                          <span className="text-xs text-slate-400">
                            {call.duration}s
                          </span>
                        )}
                      </div>

                      {call.result?.summary && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {call.result.summary.substring(0, 120)}
                          {call.result.summary.length > 120 ? "..." : ""}
                        </p>
                      )}

                      <div className="mt-2 text-[11px] text-slate-400">
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
