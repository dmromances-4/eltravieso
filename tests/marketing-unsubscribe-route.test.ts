import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/marketing/consent", () => ({
  revokeEmailOptIn: vi.fn().mockResolvedValue(undefined),
}));

import { revokeEmailOptIn } from "@/lib/marketing/consent";
import { createUnsubscribeToken } from "@/lib/marketing/unsubscribe";
import { GET } from "@/app/api/marketing/unsubscribe/route";

describe("GET /api/marketing/unsubscribe", () => {
  beforeEach(() => {
    process.env.MARKETING_UNSUBSCRIBE_SECRET = "test-secret-at-least-32-characters-long";
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    vi.mocked(revokeEmailOptIn).mockClear();
  });

  it("redirects to confirmation page after valid token", async () => {
    const token = createUnsubscribeToken("user-abc");
    const request = new Request(`https://example.com/api/marketing/unsubscribe?token=${token}`);

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/marketing/unsubscribe?ok=1");
    expect(revokeEmailOptIn).toHaveBeenCalledWith("user-abc");
  });

  it("redirects to error page for invalid token", async () => {
    const request = new Request("https://example.com/api/marketing/unsubscribe?token=bad");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/marketing/unsubscribe?error=invalid");
    expect(revokeEmailOptIn).not.toHaveBeenCalled();
  });

  it("returns JSON when Accept application/json", async () => {
    const token = createUnsubscribeToken("user-json");
    const request = new Request(`https://example.com/api/marketing/unsubscribe?token=${token}`, {
      headers: { Accept: "application/json" },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("dado de baja");
  });
});
