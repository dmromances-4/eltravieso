import { describe, expect, it } from "vitest";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/marketing/unsubscribe";
import { parseAudience, validateCreateCampaignInput } from "@/lib/marketing/types";

describe("marketing unsubscribe", () => {
  it("creates and verifies token", () => {
    process.env.MARKETING_UNSUBSCRIBE_SECRET = "test-secret-at-least-32-characters-long";
    const token = createUnsubscribeToken("user-123");
    expect(verifyUnsubscribeToken(token)).toBe("user-123");
    expect(verifyUnsubscribeToken("bad-token")).toBeNull();
  });
});

describe("validateCreateCampaignInput", () => {
  it("requires subject for email", () => {
    const result = validateCreateCampaignInput({
      name: "Promo",
      channel: "EMAIL",
      bodyText: "Hola",
    });
    expect(typeof result).toBe("string");
  });

  it("accepts valid sms campaign", () => {
    const result = validateCreateCampaignInput({
      name: "SMS promo",
      channel: "SMS",
      bodyText: "Hola vermut",
    });
    expect(typeof result).not.toBe("string");
    if (typeof result !== "string") {
      expect(result.channel).toBe("SMS");
    }
  });
});

describe("parseAudience", () => {
  it("parses roles array", () => {
    expect(parseAudience({ roles: ["USER", "ADMIN"] })).toEqual({ roles: ["USER", "ADMIN"] });
  });
});
