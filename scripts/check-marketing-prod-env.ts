#!/usr/bin/env tsx
/**
 * Pre-flight de variables de campañas para producción.
 * npm run check:marketing-prod
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v?.trim() ? v.trim() : undefined;
}

function fail(message: string) {
  console.error(`FAIL ${message}`);
  return false;
}

function ok(message: string) {
  console.log(`OK   ${message}`);
  return true;
}

function main() {
  let passed = true;

  console.log("=== Marketing production env check ===\n");

  const resendKey = env("RESEND_API_KEY");
  const fromEmail = env("MARKETING_FROM_EMAIL");
  const unsubSecret = env("MARKETING_UNSUBSCRIBE_SECRET");
  const appUrl = env("NEXT_PUBLIC_APP_URL");
  const mock = env("MARKETING_MOCK");

  if (!resendKey) passed = fail("RESEND_API_KEY missing") && passed;
  else ok("RESEND_API_KEY set");

  if (!fromEmail) passed = fail("MARKETING_FROM_EMAIL missing") && passed;
  else ok(`MARKETING_FROM_EMAIL=${fromEmail}`);

  if (!unsubSecret || unsubSecret.length < 32) {
    passed = fail("MARKETING_UNSUBSCRIBE_SECRET missing or shorter than 32 chars") && passed;
  } else ok("MARKETING_UNSUBSCRIBE_SECRET length OK");

  if (!appUrl || appUrl.includes("localhost")) {
    passed = fail("NEXT_PUBLIC_APP_URL must be the public production URL (not localhost)") && passed;
  } else ok(`NEXT_PUBLIC_APP_URL=${appUrl}`);

  if (mock === "true") {
    passed = fail("MARKETING_MOCK=true disables real sends — set false in Production") && passed;
  } else ok("MARKETING_MOCK not true");

  const twilioSid = env("TWILIO_ACCOUNT_SID");
  if (twilioSid) ok("TWILIO_ACCOUNT_SID set (SMS/WhatsApp enabled)");
  else console.log("INFO TWILIO_* not set — SMS/WhatsApp blocked (expected for email-only MVP)");

  console.log("");
  if (passed) {
    console.log("All required marketing env checks passed.");
    process.exit(0);
  }
  console.error("Fix the issues above in Vercel Production, then redeploy.");
  process.exit(1);
}

main();
