"use client";

import { useEffect, useState } from "react";
import { MapPin, Search, Globe, Link2, Building2 } from "lucide-react";

interface ToolStatus {
  id: string;
  label: string;
  enabled: boolean;
  keyConfigured: boolean;
  lastRun: { at: string; discovered: number; error?: string } | null;
}

function iconFor(id: string) {
  switch (id) {
    case "google-maps":
      return <MapPin className="w-3 h-3 text-[#ff9ecb]" />;
    case "google-search":
      return <Search className="w-3 h-3 text-[#7cc4ff]" />;
    case "linkedin":
      return <Link2 className="w-3 h-3 text-[#7cc4ff]" />;
    case "directories":
      return <Building2 className="w-3 h-3 text-[#ffd58a]" />;
    default:
      return <Globe className="w-3 h-3 text-[#b094ff]" />;
  }
}

export function ToolsStatusPanel() {
  const [tools, setTools] = useState<ToolStatus[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tools", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setTools(d.data as ToolStatus[]);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (tools.length === 0) return null;

  const enabled = tools.filter((t) => t.enabled);
  if (enabled.length === 0) return null;

  return (
    <div className="px-5 pb-2 flex items-center gap-1.5 overflow-x-auto flex-shrink-0">
      <span className="text-[9.5px] uppercase tracking-[0.18em] text-[#6a5f86] font-semibold flex-shrink-0 pr-1">
        Sources
      </span>
      {enabled.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] text-[#c9c0e6] whitespace-nowrap"
          title={
            t.lastRun
              ? `Last run: ${t.lastRun.discovered} leads${t.lastRun.error ? ` — ${t.lastRun.error}` : ""}`
              : t.keyConfigured
                ? "API key configured"
                : "Keyless"
          }
        >
          {iconFor(t.id)}
          {t.label}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              t.lastRun && t.lastRun.error ? "bg-[#ff5fa2]" : t.keyConfigured ? "bg-[#34f5c5]" : "bg-[#f0b429]"
            }`}
          />
          {t.lastRun && <span className="text-[#8f86a8]">{t.lastRun.discovered}</span>}
        </div>
      ))}
    </div>
  );
}