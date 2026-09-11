/**
 * Discovery Service — Factory
 *
 * Returns the real tool-registry provider by default, or the synthetic
 * demo provider when DISCOVERY_TOOLS is set to "synthetic".
 */

import type { LeadDiscoveryProvider } from "@/lib/types";
import { ToolRegistryDiscoveryProvider } from "../tools/registry";
import { SyntheticDiscoveryProvider } from "./synthetic-data";

export { SyntheticDiscoveryProvider } from "./synthetic-data";

export function createDiscoveryProvider(): LeadDiscoveryProvider {
  const raw = (process.env.DISCOVERY_TOOLS || "").trim().toLowerCase();
  if (raw === "synthetic") return new SyntheticDiscoveryProvider();
  return new ToolRegistryDiscoveryProvider();
}