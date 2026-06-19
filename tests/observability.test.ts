import { describe, expect, it } from "vitest";
import { redactMetadata } from "@/lib/observability/logger";
import { hashAuditIdentifier } from "@/lib/observability/audit";
import { buildWebhookDedupeId } from "@/lib/observability/webhook-dedupe";
import { buildRequestContext } from "@/lib/observability/request-context";
import { redactSentryEvent } from "@/lib/observability/sentry-redact";

describe("observability logger", () => {
  it("redacts sensitive metadata keys", () => {
    const redacted = redactMetadata({
      password: "super-secret-password",
      orderId: "ord_123",
    });

    expect(redacted.orderId).toBe("ord_123");
    expect(String(redacted.password)).not.toContain("super-secret-password");
  });
});

describe("audit helpers", () => {
  it("hashes identifiers consistently", () => {
    expect(hashAuditIdentifier("User@Example.com")).toBe(hashAuditIdentifier("user@example.com"));
  });
});

describe("webhook dedupe", () => {
  it("builds stable dedupe ids", () => {
    const first = buildWebhookDedupeId("holded", '{"a":1}', "bar_1");
    const second = buildWebhookDedupeId("holded", '{"a":1}', "bar_1");
    const different = buildWebhookDedupeId("holded", '{"a":2}', "bar_1");

    expect(first).toBe(second);
    expect(first).not.toBe(different);
  });
});

describe("request context", () => {
  it("reads request id from incoming headers", () => {
    const request = new Request("https://example.com/api/checkout", {
      headers: {
        "x-request-id": "req_test_123",
        "x-forwarded-for": "203.0.113.10",
      },
    });

    const context = buildRequestContext(request, "user_1");
    expect(context.requestId).toBe("req_test_123");
    expect(context.userId).toBe("user_1");
    expect(context.ip).toBe("203.0.113.10");
    expect(context.path).toBe("/api/checkout");
  });
});

describe("sentry redaction", () => {
  it("redacts sensitive request headers", () => {
    const event = redactSentryEvent({
      request: {
        headers: {
          authorization: "Bearer secret-token",
          "content-type": "application/json",
        },
      },
    });

    expect(event.request?.headers?.authorization).not.toBe("Bearer secret-token");
    expect(event.request?.headers?.["content-type"]).toBe("application/json");
  });
});
