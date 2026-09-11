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
  Sparkles,
  Search,
  ArrowUpDown,
  PhoneCall,
  X,
  ShieldCheck,
  TrendingUp,
  Target,
  Mic,
  Crown,
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

function ScoreRing({ score, size = 50 }: { score: number; size?: number }) {
  const stroke = 4.5;
  const radius = (size - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color =
    score >= 75 ? "#34f5c5" : score >= 50 ? "#ffc85c" : "#ff6b8a";

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="val"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill={color}
        >
          {score}
        </text>
      </svg>
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7a52ff]/25 to-[#ff5fa2]/25 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#c9c0e6]">
        {children}
      </span>
    </div>
  );
}

export function LeadDashboardPanel({
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
      const res = await fetch(`/api/leads/${leadId}/call`, { method: "POST" });
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

  const getStatusBadge = (qual: string) => {
    switch (qual) {
      case "qualified":
        return <span className="status-badge verified">Verified</span>;
      case "not_qualified":
        return <span className="status-badge failed">Unqualified</span>;
      case "needs_follow_up":
        return <span className="status-badge in-progress">Follow Up</span>;
      default:
        return <span className="status-badge pending">Discovered</span>;
    }
  };

  const selectedLead = leads?.find((l) => l.id === selectedLeadId);

  const totalLeads = leads?.length || 0;
  const highIntentLeads = leads?.filter((l) => l.score >= 70).length || 0;
  const qualifiedLeads =
    leads?.filter((l) => l.qualification === "qualified").length || 0;
  const calledLeads = leads?.filter((l) => l.latestCall !== null).length || 0;

  const metrics = [
    { label: "Discovered", value: totalLeads, icon: <Target className="w-3.5 h-3.5" />, tone: "#b094ff" },
    { label: "High Match 70+", value: highIntentLeads, icon: <Sparkles className="w-3.5 h-3.5" />, tone: "#ff9ecb" },
    { label: "AI Verified", value: qualifiedLeads, icon: <ShieldCheck className="w-3.5 h-3.5" />, tone: "#34f5c5" },
    { label: "Calls Placed", value: calledLeads, icon: <PhoneCall className="w-3.5 h-3.5" />, tone: "#f0b429" },
  ];

  return (
    <div className="panel relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
      {/* Header */}
      <div className="panel-header flex items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7a52ff]/30 to-[#ff5fa2]/30 border border-white/12 flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#ffd58a]" />
          </div>
          <div>
            <h2>Lead Pipeline</h2>
            <span className="text-[10px] text-[#7c7199] mt-0.5 block">
              Evidence-based scoring & CALL-E dispatch
            </span>
          </div>
        </div>
        <button
          onClick={() => setSortBy(sortBy === "score" ? "createdAt" : "score")}
          className="btn btn-secondary btn-sm"
          title="Toggle Sort"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#b094ff]" />
          Sort: {sortBy === "score" ? "AI Score" : "Recent"}
        </button>
      </div>
      <hr className="panel-divider" />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 px-4 pt-3 flex-shrink-0">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card p-2.5 shimmer-sweep">
            <div className="flex items-center gap-1.5 mb-1" style={{ color: m.tone }}>
              {m.icon}
              <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-90">
                {m.label}
              </span>
            </div>
            <div className="text-lg font-extrabold text-white leading-none">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#7c7199] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by name, city, specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs premium-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterQual}
            onChange={(e) => setFilterQual(e.target.value)}
            className="text-xs premium-input px-2 py-1.5 bg-transparent"
          >
            <option value="all">All</option>
            <option value="qualified" className="bg-[#0b0524]">Qualified</option>
            <option value="needs_follow_up" className="bg-[#0b0524]">Follow Up</option>
            <option value="not_qualified" className="bg-[#0b0524]">Unqualified</option>
            <option value="pending" className="bg-[#0b0524]">Pending</option>
          </select>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="text-xs premium-input px-2 py-1.5 bg-transparent"
          >
            <option value={0}>Any Score</option>
            <option value={50} className="bg-[#0b0524]">50+</option>
            <option value={75} className="bg-[#0b0524]">75+</option>
            <option value={85} className="bg-[#0b0524]">85+</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leads list */}
        <div
          className={`overflow-y-auto ${selectedLead ? "w-1/2 border-r border-white/10" : "w-full"}`}
        >
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 rounded-full border-2 border-[#7a52ff]/30 border-t-[#d23cff] animate-spin" />
              <div className="text-xs text-[#7c7199] mt-3">Scanning prospects...</div>
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#7a52ff]/15 to-[#ff5fa2]/15 border border-white/10 flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-[#7c7199]" />
              </div>
              <p className="text-sm font-semibold text-[#c9c0e6]">No leads found</p>
              <p className="text-xs text-[#7c7199] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Type a research request in the header or ask the AI assistant to discover leads.
              </p>
            </div>
          ) : (
            <div>
              {leads.map((lead, idx) => {
                const isSelected = lead.id === selectedLeadId;
                const isCalling =
                  callMutation.isPending && callMutation.variables === lead.id;

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={`lead-card animate-fade-in ${isSelected ? "selected" : ""}`}
                    style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <ScoreRing score={lead.score} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13.5px] font-semibold text-white truncate">
                              {lead.name}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-[#8f86a8] mt-1">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#6a5f86]" />
                              {lead.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#6a5f86]" />
                              {lead.location}
                            </span>
                            {lead.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-[#6a5f86]" />
                                {lead.phone}
                              </span>
                            )}
                          </div>

                          {lead.hypothesis && (
                            <p className="text-[11px] text-[#b9aed8] mt-2 bg-white/[0.04] p-2 rounded-lg border border-white/[0.06] line-clamp-2 leading-relaxed">
                              {lead.hypothesis}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {getStatusBadge(lead.qualification)}
                            {lead.evidence && lead.evidence.length > 0 && (
                              <>
                                {lead.evidence.slice(0, 2).map((e) => (
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
                                    {e.claim.substring(0, 22)}...
                                  </span>
                                ))}
                                {lead.evidence.length > 2 && (
                                  <span className="text-[10px] text-[#6a5f86] font-medium">
                                    +{lead.evidence.length - 2}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex flex-col items-end gap-1.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => callMutation.mutate(lead.id)}
                          disabled={isCalling || !lead.phone}
                          className={`btn btn-sm ${
                            lead.latestCall ? "btn-secondary" : "btn-primary"
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
                          <span className="text-[10px] text-[#34f5c5] font-bold flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5" />
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

        {/* Lead detail drawer */}
        {selectedLead && (
          <div className="w-1/2 overflow-y-auto p-5 flex flex-col gap-4 bg-black/20">
            <div className="flex items-start justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <ScoreRing score={selectedLead.score} size={62} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {selectedLead.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8f86a8] mt-1">
                    <span>{selectedLead.category}</span>
                    <span className="text-[#4a3f68]">•</span>
                    <span>{selectedLead.location}</span>
                  </div>
                  {getStatusBadge(selectedLead.qualification)}
                </div>
              </div>
              <button
                onClick={() => onSelectLead("")}
                className="p-1.5 rounded-lg text-[#7c7199] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action banner */}
            <div className="border-gradient rounded-2xl p-[1px]">
              <div className="glass-strong rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#ff9ecb]" />
                    Ready for AI Agent Calling
                  </div>
                  <div className="text-[11px] text-[#b9aed8] mt-1 font-mono">
                    {selectedLead.phone || "No phone"}
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
            </div>

            {/* Score breakdown */}
            <div className="detail-card p-4">
              <SectionTitle icon={<Sparkles className="w-3 h-3 text-[#ffd58a]" />}>
                Score Breakdown ({selectedLead.score}/100)
              </SectionTitle>
              {selectedLead.scoreComponents ? (
                <div className="space-y-2 text-[11px]">
                  {Object.entries(selectedLead.scoreComponents).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-[#b9aed8] font-medium mb-1 capitalize">
                        <span>{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-bold text-white">{value}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#7c7199]">Standard heuristic scoring applied.</div>
              )}
            </div>

            {/* Hypothesis & Strategy */}
            <div className="detail-card p-4">
              <SectionTitle icon={<ShieldCheck className="w-3 h-3 text-[#34f5c5]" />}>
                Hypothesis & Recommendation
              </SectionTitle>
              <div className="space-y-2.5 text-[11.5px]">
                <div>
                  <span className="font-semibold text-white">Hypothesis: </span>
                  <p className="text-[#b9aed8] mt-0.5 leading-relaxed">
                    {selectedLead.hypothesis || "No specific hypothesis generated."}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-white">Recommended: </span>
                  <p className="text-[#b9aed8] mt-0.5 leading-relaxed">
                    {selectedLead.recommendedAction ||
                      "Call office manager to confirm after-hours scheduling bottleneck."}
                  </p>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="detail-card p-4">
              <SectionTitle icon={<Users className="w-3 h-3 text-[#b094ff]" />}>
                Company & Contact Profile
              </SectionTitle>
              <div className="grid grid-cols-2 gap-2.5 text-[11.5px] text-[#b9aed8]">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#6a5f86]" />
                  <span>
                    Contact: <strong className="text-white">{selectedLead.decisionMaker || "Not listed"}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#6a5f86]" />
                  <span>
                    Staff: <strong className="text-white">{selectedLead.employeeCount || "5-15"}</strong>
                  </span>
                </div>
                {selectedLead.website && (
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#6a5f86]" />
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#b094ff] hover:underline truncate"
                    >
                      {selectedLead.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence */}
            <div className="detail-card p-4">
              <SectionTitle icon={<TrendingUp className="w-3 h-3 text-[#f0b429]" />}>
                Grounding Evidence ({selectedLead.evidence?.length || 0})
              </SectionTitle>
              {selectedLead.evidence && selectedLead.evidence.length > 0 ? (
                <div className="space-y-2">
                  {selectedLead.evidence.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
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
                        <span className="text-[10px] text-[#6a5f86]">
                          {Math.round(ev.confidence * 100)}% • {ev.source}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[#d9d2f0] font-medium">{ev.claim}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#7c7199]">No evidence items recorded.</div>
              )}
            </div>

            {/* Latest call */}
            {selectedLead.latestCall && (
              <div className="detail-card p-4">
                <SectionTitle icon={<PhoneCall className="w-3 h-3 text-[#34f5c5]" />}>
                  Latest Call Result
                </SectionTitle>
                <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.07]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white text-[11.5px]">
                      Status: {selectedLead.latestCall.status}
                    </span>
                    {selectedLead.latestCall.result?.qualification && (
                      <span className="status-badge verified">
                        {selectedLead.latestCall.result.qualification}
                      </span>
                    )}
                  </div>
                  {selectedLead.latestCall.result?.summary && (
                    <p className="text-[#b9aed8] text-[11.5px] leading-relaxed mt-1">
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