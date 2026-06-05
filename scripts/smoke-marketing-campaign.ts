#!/usr/bin/env tsx
/**
 * Smoke test local de campañas (preview + unsubscribe token).
 * npm run smoke:marketing
 *
 * Requiere DATABASE_URL. Usa MARKETING_MOCK=true si no hay RESEND/TWILIO.
 */

import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/marketing/unsubscribe";
import { resolveCampaignRecipients } from "@/lib/marketing/consent";

function env(name: string) {
  const v = process.env[name];
  return v && v.trim() ? "set" : "missing";
}

async function main() {
  process.env.MARKETING_UNSUBSCRIBE_SECRET ??=
    "smoke-test-secret-at-least-32-characters-long";

  console.log("=== Marketing env check ===");
  console.log("RESEND_API_KEY:", env("RESEND_API_KEY"));
  console.log("MARKETING_FROM_EMAIL:", env("MARKETING_FROM_EMAIL"));
  console.log("MARKETING_UNSUBSCRIBE_SECRET:", env("MARKETING_UNSUBSCRIBE_SECRET"));
  console.log("TWILIO_ACCOUNT_SID:", env("TWILIO_ACCOUNT_SID"));
  console.log("MARKETING_MOCK:", process.env.MARKETING_MOCK ?? "false");

  const token = createUnsubscribeToken("smoke-user");
  const verified = verifyUnsubscribeToken(token);
  if (verified !== "smoke-user") {
    throw new Error("Unsubscribe token round-trip failed");
  }
  console.log("OK unsubscribe token");

  const emailRecipients = await resolveCampaignRecipients("EMAIL", {});
  const smsRecipients = await resolveCampaignRecipients("SMS", {});
  console.log(`OK resolveCampaignRecipients EMAIL=${emailRecipients.length} SMS=${smsRecipients.length}`);

  console.log("OK marketing smoke complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
