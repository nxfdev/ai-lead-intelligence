/**
 * Discovery tool registry.
 *
 * Reads DISCOVERY_TOOLS from env, runs enabled tools in parallel with
 * per-tool error isolation, deduplicates results, and records tool
 * status for the /api/tools route. Falls back to the synthetic demo
 * data when everything comes back empty.
 */

import type { LeadDiscoveryProvider, RawLead, SearchCriteria, DiscoveryToolStatus, SearchStrategyPlan } from "@/lib/types";
import { GoogleMapsDiscoveryTool } from "./google-maps";
import { GoogleSearchDiscoveryTool } from "./google-search";
import { DirectoryDiscoveryTool } from "./directories";
import { LinkedInDiscoveryTool } from "./linkedin";
import { DuckDuckGoDiscoveryTool } from "./duckduckgo";
import { ApolloDiscoveryTool } from "./apollo";
import { dedupeLeads } from "./lib";
import { SyntheticDiscoveryProvider } from "../services/synthetic-data";

interface ToolDef {
  id: string;
  label: string;
  instance: LeadDiscoveryProvider;
  requiresKey: boolean;
  isConfigured: () => boolean;
}

const TOOL_DEFS: ToolDef[] = [
  {
    id: "google-maps",
    label: "Google Maps",
    instance: new GoogleMapsDiscoveryTool(),
    requiresKey: true,
    isConfigured: () => Boolean(process.env.GOOGLE_MAPS_API_KEY),
  },
  {
    id: "directories",
    label: "Directories",
    instance: new DirectoryDiscoveryTool(),
    requiresKey: false,
    isConfigured: () => true,
  },
  {
    id: "duckduckgo",
    label: "DuckDuckGo",
    instance: new DuckDuckGoDiscoveryTool(),
    requiresKey: false,
    isConfigured: () => true,
  },
  {
    id: "google-search",
    label: "Google Search",
    instance: new GoogleSearchDiscoveryTool(),
    requiresKey: true,
    isConfigured: () => Boolean(process.env.SERP_API_KEY),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    instance: new LinkedInDiscoveryTool(),
    requiresKey: true,
    isConfigured: () => Boolean(process.env.LINKEDIN_SCRAPE_URL),
  },
  {
    id: "apollo",
    label: "Apollo.io",
    instance: new ApolloDiscoveryTool(),
    requiresKey: true,
    isConfigured: () => Boolean(process.env.APOLLO_API_KEY),
  },
];

interface ToolRunRecord {
  at: string;
  discovered: number;
  error?: string;
}

const runRecord = new Map<string, ToolRunRecord | null>();

function enabledIds(): string[] {
  const raw = process.env.DISCOVERY_TOOLS || "duckduckgo,google-maps,directories,google-search,linkedin,apollo";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getToolStatuses(): DiscoveryToolStatus[] {
  const ids = enabledIds();
  return TOOL_DEFS.map((t) => ({
    id: t.id,
    label: t.label,
    enabled: ids.includes(t.id),
    keyConfigured: t.isConfigured(),
    lastRun: runRecord.get(t.id) ?? null,
  }));
}

export class ToolRegistryDiscoveryProvider implements LeadDiscoveryProvider {
  async search(criteria: SearchCriteria, strategy?: SearchStrategyPlan): Promise<RawLead[]> {
    const activeIds = enabledIds();
    const activeTools = TOOL_DEFS.filter((t) => activeIds.includes(t.id));

    if (activeTools.length === 0) {
      return this.fallbackSynthetic(criteria);
    }

    const results = await Promise.allSettled(
      activeTools.map(async (tool) => {
        try {
          // Pass strategy to tool if supported (like GoogleMapsDiscoveryTool)
          const leads = await (tool.instance as { search: (c: SearchCriteria, opts?: unknown) => Promise<RawLead[]> }).search(
            criteria,
            { strategy }
          );
          runRecord.set(tool.id, {
            at: new Date().toISOString(),
            discovered: leads.length,
          });
          return leads;
        } catch (err) {
          runRecord.set(tool.id, {
            at: new Date().toISOString(),
            discovered: 0,
            error: err instanceof Error ? err.message.slice(0, 120) : "Unknown error",
          });
          return [] as RawLead[];
        }
      })
    );

    const all: RawLead[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const lead of result.value) {
          if (lead.source !== "synthetic") all.push(lead);
        }
      }
    }

    const deduped = dedupeLeads(all);
    if (deduped.length === 0) return this.fallbackSynthetic(criteria);
    return deduped;
  }

  private async fallbackSynthetic(criteria: SearchCriteria): Promise<RawLead[]> {
    runRecord.set("synthetic", {
      at: new Date().toISOString(),
      discovered: 0,
      error: "Fallback: all tools returned no results",
    });
    const syn = new SyntheticDiscoveryProvider();
    const leads = await syn.search(criteria);
    runRecord.set("synthetic", { at: new Date().toISOString(), discovered: leads.length });
    return leads;
  }
}