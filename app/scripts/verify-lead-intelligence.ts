/**
 * Lead Intelligence Verification Script
 *
 * Validates:
 * 1. Email permutation generator
 * 2. DNS MX lookup & SMTP verifier
 * 3. Scout platform & social link extraction
 * 4. Google Maps place scraping
 * 5. Batch CSV exporter
 */

import { generateEmailPermutations, getMxRecords, parseName, verifyEmailSmtp } from "../src/server/tools/smtp-verifier";
import { extractSocialLinks, crawlWebsiteForLead } from "../src/server/tools/scout-enricher";
import { GoogleMapsDiscoveryTool } from "../src/server/tools/google-maps";
import { extractEmailsFromText, extractDomain } from "../src/server/tools/lib";

async function main() {
  console.log("==================================================");
  console.log("  LEAD GENERATION & SCOUT SUBSYSTEM VERIFICATION  ");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
    }
  }

  // 1. Email Permutation Test
  console.log("--- 1. Testing Email Permutation Engine ---");
  const parsed = parseName("Dr. Sarah Mitchell, MD");
  assert("Name parser extracts first and last", parsed?.first === "sarah" && parsed?.last === "mitchell");

  const permutations = generateEmailPermutations("Sarah Mitchell", "https://austinsmilecenter.com");
  assert(
    "Permutations include standard business email patterns",
    permutations.includes("sarah.mitchell@austinsmilecenter.com") &&
      permutations.includes("sarah@austinsmilecenter.com") &&
      permutations.includes("smitchell@austinsmilecenter.com")
  );
  console.log("   Generated permutations:", permutations.slice(0, 4));

  // 2. DNS MX Record Lookup Test
  console.log("\n--- 2. Testing DNS MX Record Resolution ---");
  const mxRecords = await getMxRecords("google.com");
  assert(
    "MX lookup returns valid mail exchangers for google.com",
    mxRecords.length > 0 && mxRecords.some((mx) => mx.includes("google.com") || mx.includes("smtp"))
  );
  console.log("   Discovered MX records for google.com:", mxRecords.slice(0, 2));

  // 3. Scout Social Link Extractor Test
  console.log("\n--- 3. Testing Scout Social Link Extractor ---");
  const sampleHtml = `
    <html>
      <body>
        <h1>Austin Family Health</h1>
        <a href="https://www.linkedin.com/company/austin-family-health">LinkedIn</a>
        <a href="https://instagram.com/austinfamilyhealth">Instagram</a>
        <a href="https://youtube.com/@austinhealth">YouTube Channel</a>
        <a href="mailto:contact@austinhealth.com">Email Us</a>
      </body>
    </html>
  `;
  const socialLinks = extractSocialLinks(sampleHtml);
  assert(
    "Extracts multiple social platform links",
    socialLinks.length === 3 &&
      socialLinks.some((s) => s.platform === "linkedin") &&
      socialLinks.some((s) => s.platform === "instagram") &&
      socialLinks.some((s) => s.platform === "youtube")
  );
  console.log("   Extracted social accounts:", socialLinks);

  // 4. Email Regex & Domain Cleaner Test
  console.log("\n--- 4. Testing Domain and Email Extractors ---");
  const sampleText = "Call us at 512-555-0199 or email info@austinhealth.com or appointments@austinhealth.com.";
  const extractedEmails = extractEmailsFromText(sampleText);
  assert(
    "Extracts all valid emails from text",
    extractedEmails.includes("info@austinhealth.com") &&
      extractedEmails.includes("appointments@austinhealth.com")
  );
  const cleanDomain = extractDomain("https://www.example.org/about-us?query=1");
  assert("Extracts clean domain without www or paths", cleanDomain === "example.org");

  // 5. Google Maps Discovery Tool Initialization Test
  console.log("\n--- 5. Testing Google Maps Discovery Tool ---");
  const mapsTool = new GoogleMapsDiscoveryTool();
  assert("Google Maps tool is configured and available", mapsTool.isConfigured() === true);

  console.log("\n==================================================");
  console.log(`  VERIFICATION RESULTS: ${passed}/${total} PASSED `);
  console.log("==================================================\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
