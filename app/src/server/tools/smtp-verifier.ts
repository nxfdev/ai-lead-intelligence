/**
 * SMTP Mailbox Verifier & Email Permutation Engine
 *
 * Inspired by Scout (https://github.com/kiryano/Scout)
 * Zero-cost direct SMTP handshake verification:
 * 1. Resolves DNS MX records.
 * 2. Connects to primary MX on port 25 with raw TCP socket.
 * 3. Probes candidate mailbox with HELO -> MAIL FROM -> RCPT TO.
 * 4. Detects catch-all domains by testing a randomized dummy address.
 */

import * as dns from "node:dns/promises";
import * as net from "node:net";
import type { EmailVerificationResult, EmailDeliverabilityStatus } from "@/lib/types";
import { extractDomain } from "./lib";

export interface NameComponents {
  first: string;
  last: string;
}

export function parseName(fullName?: string | null): NameComponents | null {
  if (!fullName) return null;
  const cleaned = fullName
    .toLowerCase()
    .replace(/\b(dr|mr|mrs|ms|prof|ceo|founder|owner|md|dds|dmd|esq)\b[\.\,]?/gi, " ")
    .replace(/[^a-z\s]/g, " ")
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { first: parts[0], last: "" };
  return {
    first: parts[0],
    last: parts[parts.length - 1],
  };
}

/**
 * Generates candidate emails for a decision-maker name and company domain.
 */
export function generateEmailPermutations(name: string, domainOrUrl: string): string[] {
  const domain = extractDomain(domainOrUrl);
  if (!domain) return [];

  const parsed = parseName(name);
  if (!parsed || !parsed.first) {
    return [`contact@${domain}`, `info@${domain}`, `office@${domain}`];
  }

  const f = parsed.first.replace(/[^a-z0-9]/g, "");
  const l = parsed.last.replace(/[^a-z0-9]/g, "");

  const patterns: string[] = [];

  if (f && l) {
    patterns.push(`${f}.${l}@${domain}`);
    patterns.push(`${f}@${domain}`);
    patterns.push(`${f}${l}@${domain}`);
    patterns.push(`${f[0]}${l}@${domain}`);
    patterns.push(`${f}_${l}@${domain}`);
    patterns.push(`${l}.${f}@${domain}`);
  } else if (f) {
    patterns.push(`${f}@${domain}`);
    patterns.push(`hello@${domain}`);
  }

  patterns.push(`contact@${domain}`);
  patterns.push(`info@${domain}`);

  return Array.from(new Set(patterns));
}

/**
 * Resolves MX records for a domain, ordered by priority.
 */
export async function getMxRecords(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) return [];
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange.trim().toLowerCase());
  } catch {
    return [];
  }
}

/**
 * Direct SMTP Socket Probe
 */
interface SmtpProbeResponse {
  code: number;
  banner?: string;
  isOk: boolean;
}

function probeSmtpAddress(
  mxHost: string,
  emailToTest: string,
  timeoutMs = 7000
): Promise<SmtpProbeResponse> {
  return new Promise((resolve) => {
    let settled = false;
    let banner = "";
    let step: "CONNECT" | "HELO" | "MAIL_FROM" | "RCPT_TO" | "QUIT" = "CONNECT";

    const socket = net.createConnection({ host: mxHost, port: 25 });
    socket.setTimeout(timeoutMs);

    const finish = (code: number, bannerText?: string, isOk = false) => {
      if (settled) return;
      settled = true;
      try {
        if (!socket.destroyed) {
          socket.write("QUIT\r\n");
          socket.end();
        }
      } catch {
        // socket might already be closed
      }
      resolve({ code, banner: bannerText, isOk });
    };

    socket.on("timeout", () => {
      socket.destroy();
      finish(408, "Connection timeout");
    });

    socket.on("error", (err) => {
      finish(599, `Socket error: ${err.message}`);
    });

    let buffer = "";
    socket.on("data", (data) => {
      buffer += data.toString("utf8");
      const lines = buffer.split("\r\n");
      // Keep trailing partial line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line) continue;
        const code = parseInt(line.slice(0, 3), 10);
        if (isNaN(code)) continue;

        // Is this a multiline response? e.g. "250-..."
        const isMultiLine = line.charAt(3) === "-";
        if (isMultiLine) continue;

        if (step === "CONNECT") {
          banner = line;
          if (code === 220) {
            step = "HELO";
            socket.write("HELO mail.leadintelligence.local\r\n");
          } else {
            return finish(code, line, false);
          }
        } else if (step === "HELO") {
          if (code === 250) {
            step = "MAIL_FROM";
            socket.write("MAIL FROM:<verify@leadintelligence.local>\r\n");
          } else {
            return finish(code, line, false);
          }
        } else if (step === "MAIL_FROM") {
          if (code === 250) {
            step = "RCPT_TO";
            socket.write(`RCPT TO:<${emailToTest}>\r\n`);
          } else {
            return finish(code, line, false);
          }
        } else if (step === "RCPT_TO") {
          const isOk = code === 250;
          return finish(code, line, isOk);
        }
      }
    });
  });
}

/**
 * Verify a single email with full MX lookup, catch-all detection, and SMTP handshake.
 */
export async function verifyEmailSmtp(
  email: string,
  options?: { skipCatchAllCheck?: boolean; timeoutMs?: number }
): Promise<EmailVerificationResult> {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { email, status: "undeliverable", error: "Invalid email format" };
  }

  const domain = parts[1].toLowerCase().trim();
  const mxHosts = await getMxRecords(domain);

  if (mxHosts.length === 0) {
    return {
      email,
      status: "undeliverable",
      error: `No MX records found for domain ${domain}`,
    };
  }

  const primaryMx = mxHosts[0];

  try {
    // Optional catch-all detection: probe a non-existent uuid address
    let isCatchAll = false;
    if (!options?.skipCatchAllCheck) {
      const dummyEmail = `probe_dummy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@${domain}`;
      const dummyRes = await probeSmtpAddress(primaryMx, dummyEmail, options?.timeoutMs);
      if (dummyRes.isOk) {
        // If dummy address succeeds with 250, domain accepts everything (Catch-All)
        isCatchAll = true;
      }
    }

    // Now probe the actual candidate email
    const probeRes = await probeSmtpAddress(primaryMx, email, options?.timeoutMs);

    let status: EmailDeliverabilityStatus = "unknown";
    if (probeRes.isOk) {
      status = isCatchAll ? "risky" : "verified";
    } else if (probeRes.code >= 550 && probeRes.code <= 559) {
      status = "undeliverable";
    } else if (probeRes.code >= 400 && probeRes.code <= 499) {
      status = "risky";
    } else {
      status = "unknown";
    }

    return {
      email,
      status,
      mxHost: primaryMx,
      isCatchAll,
      smtpBanner: probeRes.banner,
      score: status === "verified" ? 100 : status === "risky" ? 50 : 0,
    };
  } catch (err) {
    return {
      email,
      status: "unknown",
      mxHost: primaryMx,
      error: (err as Error).message,
    };
  }
}

/**
 * Finds the first verified email from a list of permutations.
 */
export async function findBestVerifiedEmail(
  name: string,
  domain: string
): Promise<EmailVerificationResult | null> {
  const candidates = generateEmailPermutations(name, domain);
  if (candidates.length === 0) return null;

  // First verify MX exists to fail fast
  const cleanDomain = extractDomain(domain);
  if (!cleanDomain) return null;
  const mxRecords = await getMxRecords(cleanDomain);
  if (mxRecords.length === 0) return null;

  for (const candidate of candidates.slice(0, 5)) {
    const result = await verifyEmailSmtp(candidate, { timeoutMs: 5000 });
    if (result.status === "verified") {
      return result;
    }
  }

  // Return the first candidate as unknown/risky if none confirmed
  return {
    email: candidates[0],
    status: "unknown",
    mxHost: mxRecords[0],
  };
}
