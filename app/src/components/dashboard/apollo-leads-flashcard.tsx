"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Rocket,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Building,
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  User,
} from "lucide-react";
import { Flashcard3D } from "./flashcard-3d";

interface ApolloLead {
  id: string;
  name: string;
  phone?: string | null;
  location?: string | null;
  category?: string | null;
  score?: number | null;
  qualification?: string | null;
  createdAt?: string | null;
  apollo: {
    title: string | null;
    organization: string | null;
    seniority: string | null;
    email: string | null;
    emailStatus: string | null;
    phoneStatus: string | null;
    linkedinUrl: string | null;
    photoUrl: string | null;
    revealRequired: boolean;
  } | null;
}

type ConfirmState =
  | { type: "enable" }
  | { type: "disable" }
  | { type: "reveal"; lead: ApolloLead }
  | null;

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}${"•".repeat(Math.max(2, user.length - 4))}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••• ••• ••••";
  return `${digits.slice(0, -4).replace(/\d/g, "•")} ${digits.slice(-4)}`;
}

export function ApolloLeadsFlashcard() {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: apolloLeads = [], refetch: refetchLeads, isFetching: loadingLeads } = useQuery({
    queryKey: ["apollo-leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads?source=apollo");
      const json = await res.json();
      return (json.data || []) as ApolloLead[];
    },
    refetchInterval: 10000,
  });

  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      const json = await res.json();
      return (json.data || {}) as Record<string, string>;
    },
  });

  const revealOn = settings["apollo.reveal"] === "on";

  const setReveal = useMutation({
    mutationFn: async (nextOn: boolean) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "apollo.reveal", value: nextOn ? "on" : "off" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update setting");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["apollo-leads"] });
    },
    onError: (err) => setNotice(err instanceof Error ? err.message : "Failed to update setting"),
  });

  const revealLead = useMutation({
    mutationFn: async (leadId: string) => {
      setBusyId(leadId);
      try {
        const res = await fetch(`/api/leads/${leadId}/reveal`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Reveal failed");
        return json.data;
      } finally {
        setBusyId(null);
      }
    },
    onSuccess: () => {
      setNotice("Contact revealed. Phone & email updated.");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["apollo-leads"] });
    },
    onError: (err) => setNotice(err instanceof Error ? err.message : "Reveal failed"),
  });

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleToggle = () => {
    if (revealOn) {
      setConfirm({ type: "disable" });
    } else {
      setConfirm({ type: "enable" });
    }
  };

  const acceptConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "enable") {
      setReveal.mutate(true);
    } else if (confirm.type === "disable") {
      setReveal.mutate(false);
    } else if (confirm.type === "reveal") {
      revealLead.mutate(confirm.lead.id);
    }
    setConfirm(null);
  };

  const needsReveal = (l: ApolloLead) =>
    !l.phone && (!l.apollo?.email || l.apollo?.revealRequired);

  return (
    <Flashcard3D glow="gold" className="p-6 glass-aladdin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
              Apollo AI Leads
            </h3>
            <p className="text-[11px] text-amber-300/70">
              Contact database discovery · Reveal phone + email
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchLeads()}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/25 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <span className="text-xs font-semibold text-slate-300">Reveal contacts</span>
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={revealOn}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                revealOn ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  revealOn ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stage hint bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${
          revealOn
            ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
            : "bg-slate-500/20 text-slate-400 border-slate-500/40"
        }`}>
          {revealOn ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {revealOn ? "Global reveal ON · new Apollo searches return phone + email" : "Global reveal OFF"}
        </span>
        <span className="text-slate-500">
          Apollo leads appear here automatically after research runs with the Apollo tool enabled.
        </span>
      </div>

      {/* Lead rows */}
      {apolloLeads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-300/60">
            <User className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-400 max-w-sm">
            No Apollo leads yet.{" "}
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ["apollo-leads"] })} className="text-amber-300 hover:text-amber-200 font-semibold cursor-pointer">
              Refresh
            </button>{" "}
            after a research run, or ask the Genie to start Apollo research.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {[
              "Add APOLLO_API_KEY to app/.env to enable discovery",
              "Set DISCOVERY_TOOLS to include \"apollo\"",
            ].map((tip) => (
              <span key={tip} className="px-2.5 py-1 rounded-full text-[10px] text-slate-500 border border-white/10 bg-white/[0.03]">
                {tip}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {apolloLeads.map((lead) => {
            const hidden = needsReveal(lead);
            return (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-amber-400/30 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500/30 to-purple-500/20 border border-white/20 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {lead.name}
                      </h4>
                      {lead.score != null && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-400/40 bg-amber-500/10">
                          {lead.score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {[lead.apollo?.title, lead.apollo?.organization].filter(Boolean).join(" · ") || "Apollo Contact"}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                      {lead.location && <span className="truncate">{lead.location}</span>}
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {lead.apollo?.email
                          ? hidden
                            ? maskEmail(lead.apollo.email)
                            : lead.apollo.email
                          : "no email"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone
                          ? hidden
                            ? maskPhone(lead.phone)
                            : lead.phone
                          : "no phone"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hidden ? (
                    <button
                      onClick={() => setConfirm({ type: "reveal", lead })}
                      disabled={busyId === lead.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {busyId === lead.id ? "Revealing…" : "Reveal"}
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-300 border border-emerald-400/40 bg-emerald-500/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Contact ready
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirm(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl p-6 glass-aladdin border border-amber-400/40 shadow-[0_0_40px_rgba(245,158,11,0.2)]"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-cinzel text-base font-bold text-white">
                  {confirm.type === "enable" && "Enable contact reveal?"}
                  {confirm.type === "disable" && "Turn off contact reveal?"}
                  {confirm.type === "reveal" && "Reveal this contact?"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {confirm.type === "enable" &&
                    "New Apollo searches will request phone + email. Each revealed contact consumes ~1 Apollo credit from your account."}
                  {confirm.type === "disable" &&
                    "New Apollo searches will return contact info without phone + email. You can still reveal individual contacts manually."}
                  {confirm.type === "reveal" &&
                    `Reveal phone + email for ${confirm.lead.name}? This consumes ~1 Apollo credit.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-white/15 hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={acceptConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                {(confirm.type === "enable" && "Enable anyway") ||
                 (confirm.type === "disable" && "Turn off") ||
                 (confirm.type === "reveal" && (busyId ? "Revealing…" : "Reveal for ~1 credit"))}
              </button>
            </div>
          </div>
        </div>
      )}
    </Flashcard3D>
  );
}