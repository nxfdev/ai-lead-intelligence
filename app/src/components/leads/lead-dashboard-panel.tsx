"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  PhoneCall,
  Info,
  X,
  ShieldCheck,
  TrendingUp,
  FileText
} from "lucide-react";

interface LeadDashboardPanelProps {
  taskId: string | null;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
}

interface EvidenceItem {
  id: string;
  type: "OBSERVED" | "INFERRED" | "VERIFIED";
  claim: string;
  source: string;
  confidence: number;
  observedAt: string;
}

interface LeadData {
  id: string;
  name: string;
  phone: string;
  website: string | null;
  location: string;
  category: string;
  score: number;
  scoreComponents: Record<string, number> | null;
  status: string;
  qualification: string;
  hypothesis: string | null;
  recommendedAction: string | null;
  decisionMaker: string | null;
  employeeCount: number | null;
  evidence: EvidenceItem[];
  latestCall: {
    id: string;
    status: string;
    completedAt: string | null;
    result: {
      summary: string;
      qualification: string;
    } | null;
  } | null;
  createdAt: string;
}

export function LeadDashboardPanel({
  taskId,
  selectedLeadId,
  onSelectLead,
}: LeadDashboardPanelProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterQual, setFilterQual] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"score" | "createdAt">("score");

  const { data: leads, isLoading } = useQuery<LeadData[]>({
    queryKey: ["leads", filterQual, minScore, sortBy, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterQual !== "all") params.set("qualification", filterQual);
      if (minScore > 0) params.set("minScore", minScore.toString());
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("sortOrder", "desc");

      const res = await fetch(`/api/leads?${params.toString()}`);
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 5000,
  });

  const callMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(`/api/leads/${leadId}/call`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger call");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });

  const getScoreBadgeClass = (score: number) => {
    if (score >= 75) return "score-badge high";
    if (score >= 50) return "score-badge medium";
    return "score-badge low";
  };

  const getStatusBadge = (qual: string) => {
    switch (qual) {
      case "qualified":
        return <span className="status-badge verified">Verified Qualified</span>;
      case "not_qualified":
        return <span className="status-badge failed">Unqualified</span>;
      case "needs_follow_up":
        return <span className="status-badge in-progress">Follow Up</span>;
      default:
        return <span className="status-badge pending">Discovered</span>;
    }
  };

  const selectedLead = leads?.find((l) => l.id === selectedLeadId);

  // Quick stats calculations
  const totalLeads = leads?.length || 0;
  const highIntentLeads = leads?.filter((l) => l.score >= 70).length || 0;
  const qualifiedLeads = leads?.filter((l) => l.qualification === "qualified").length || 0;
  const calledLeads = leads?.filter((l) => l.latestCall !== null).length || 0;

  return (
    <div className="panel relative flex flex-col h-full bg-white">
      {/* Top Header */}
      <div className="panel-header flex items-center justify-between border-b border-slate-200">
        <div>
          <h2>Lead Pipeline & Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked prospects with automated evidence synthesis & CALL-E voice dispatch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === "score" ? "createdAt" : "score")}
            className="btn btn-secondary btn-sm text-xs"
            title="Toggle Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort: {sortBy === "score" ? "AI Score" : "Recent"}
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-4 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-slate-500 font-medium">Total Discovered</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{totalLeads}</div>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-slate-500 font-medium">High Match (70+)</div>
          <div className="text-lg font-bold text-blue-600 mt-0.5">{highIntentLeads}</div>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-slate-500 font-medium">Calls Placed</div>
          <div className="text-lg font-bold text-indigo-600 mt-0.5">{calledLeads}</div>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-slate-500 font-medium">AI Verified</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{qualifiedLeads}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="px-5 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by business name, city, specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterQual}
            onChange={(e) => setFilterQual(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value="all">All Qualifications</option>
            <option value="qualified">Verified Qualified</option>
            <option value="needs_follow_up">Needs Follow Up</option>
            <option value="not_qualified">Not Qualified</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value={0}>Any Score</option>
            <option value={50}>Score &gt;= 50</option>
            <option value={75}>Score &gt;= 75 (High Match)</option>
            <option value={85}>Score &gt;= 85 (Top Tier)</option>
          </select>
        </div>
      </div>

      {/* Main List & Side Detail View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leads Scroll Area */}
        <div className={`overflow-y-auto ${selectedLead ? "w-1/2 border-r border-slate-200" : "w-full"}`}>
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading prospects...
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No leads found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Type a research request in the header or in the AI Copilot on the right to discover leads.
              </p>
            </div>
          ) : (
            <div>
              {leads.map((lead) => {
                const isSelected = lead.id === selectedLeadId;
                const isCalling =
                  callMutation.isPending && callMutation.variables === lead.id;

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={`lead-card p-4 transition border-b border-slate-100 cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? "bg-blue-50/50 border-l-4 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Score Badge */}
                        <div className={getScoreBadgeClass(lead.score)}>
                          {lead.score}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                              {lead.name}
                            </h3>
                            {getStatusBadge(lead.qualification)}
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {lead.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {lead.location}
                            </span>
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {lead.phone}
                              </span>
                            )}
                          </div>

                          {lead.hypothesis && (
                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-200/60 line-clamp-2 leading-relaxed">
                              <span className="font-semibold text-slate-700">Hypothesis: </span>
                              {lead.hypothesis}
                            </p>
                          )}

                          {/* Evidence tags */}
                          {lead.evidence && lead.evidence.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {lead.evidence.slice(0, 3).map((e) => (
                                <span
                                  key={e.id}
                                  className={`evidence-chip ${
                                    e.type === "VERIFIED"
                                      ? "verified"
                                      : e.type === "INFERRED"
                                      ? "inferred"
                                      : "observed"
                                  }`}
                                  title={e.claim}
                                >
                                  {e.claim.substring(0, 24)}...
                                </span>
                              ))}
                              {lead.evidence.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +{lead.evidence.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Call Action */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => callMutation.mutate(lead.id)}
                          disabled={isCalling || !lead.phone}
                          className={`btn btn-sm ${
                            lead.latestCall
                              ? "btn-secondary text-slate-700"
                              : "btn-primary"
                          }`}
                          title="Trigger AI phone qualification call via CALL-E"
                        >
                          <PhoneCall className={`w-3.5 h-3.5 ${isCalling ? "animate-spin" : ""}`} />
                          {isCalling
                            ? "Calling..."
                            : lead.latestCall
                            ? "Re-Call"
                            : "Call"}
                        </button>
                        {lead.latestCall && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {lead.latestCall.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lead Inspection Drawer / Right Sub-Panel */}
        {selectedLead && (
          <div className="w-1/2 overflow-y-auto bg-slate-50/50 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedLead.name}
                  </h3>
                  {getStatusBadge(selectedLead.qualification)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{selectedLead.category}</span>
                  <span>•</span>
                  <span>{selectedLead.location}</span>
                </div>
              </div>
              <button
                onClick={() => onSelectLead("")}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Call Banner */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-blue-900">
                  Ready for AI Agent Calling
                </div>
                <div className="text-xs text-blue-700 mt-0.5">
                  Phone: <span className="font-mono font-medium">{selectedLead.phone || "No phone"}</span>
                </div>
              </div>
              <button
                onClick={() => callMutation.mutate(selectedLead.id)}
                disabled={callMutation.isPending || !selectedLead.phone}
                className="btn btn-primary btn-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                {callMutation.isPending ? "Connecting..." : "Trigger Call"}
              </button>
            </div>

            {/* Score Breakdown Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Score Breakdown ({selectedLead.score}/100)
                  </span>
                </div>
              </div>

              {selectedLead.scoreComponents ? (
                <div className="space-y-2 text-xs">
                  {Object.entries(selectedLead.scoreComponents).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-slate-600 font-medium mb-1 capitalize">
                        <span>{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-bold">{value}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Standard heuristic scoring applied.</div>
              )}
            </div>

            {/* Hypothesis & Strategy */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase text-slate-700 tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Sales Hypothesis & Recommendation</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-slate-700">Hypothesis:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded">
                    {selectedLead.hypothesis || "No specific hypothesis generated."}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Recommended Action:</span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded">
                    {selectedLead.recommendedAction || "Call office manager to confirm after-hours scheduling bottleneck."}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Contacts & Metadata */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold uppercase text-slate-700 tracking-wider block mb-2">
                Company & Contact Profile
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact: <strong>{selectedLead.decisionMaker || "Not listed"}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Staff: <strong>{selectedLead.employeeCount || "5-15"}</strong></span>
                </div>
                {selectedLead.website && (
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {selectedLead.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence & Grounding */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold uppercase text-slate-700 tracking-wider block mb-2">
                Grounding Evidence ({selectedLead.evidence?.length || 0})
              </span>
              {selectedLead.evidence && selectedLead.evidence.length > 0 ? (
                <div className="space-y-2">
                  {selectedLead.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/70"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`evidence-chip ${
                            ev.type === "VERIFIED"
                              ? "verified"
                              : ev.type === "INFERRED"
                              ? "inferred"
                              : "observed"
                          }`}
                        >
                          {ev.type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round(ev.confidence * 100)}% conf • {ev.source}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{ev.claim}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400">No evidence items recorded.</div>
              )}
            </div>

            {/* Latest Call Result */}
            {selectedLead.latestCall && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold uppercase text-slate-700 tracking-wider block mb-2">
                  Latest Call Result
                </span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-800">
                      Status: {selectedLead.latestCall.status}
                    </span>
                    {selectedLead.latestCall.result?.qualification && (
                      <span className="status-badge verified">
                        {selectedLead.latestCall.result.qualification}
                      </span>
                    )}
                  </div>
                  {selectedLead.latestCall.result?.summary && (
                    <p className="text-slate-600 leading-relaxed mt-1">
                      {selectedLead.latestCall.result.summary}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
