import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin/campaigns/[id]/preview/route";

const { requireAdminMock, runCampaignSendMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  runCampaignSendMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin-api", () => ({
  requireAdminUser: requireAdminMock,
  adminApiErrorResponse: (error: unknown) =>
    new Response(JSON.stringify({ message: error instanceof Error ? error.message : "Error" }), {
      status: 403,
    }),
}));

vi.mock("@/lib/marketing/send-campaign", () => ({
  runCampaignSend: runCampaignSendMock,
}));

describe("admin campaigns preview API", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    runCampaignSendMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: "admin-1", email: "admin@test.com", role: "ADMIN" });
  });

  it("POST preview returns recipient counts", async () => {
    runCampaignSendMock.mockResolvedValue({ sent: 1, failed: 0, total: 1 });

    const res = await POST(new Request("http://localhost/api/admin/campaigns/c1/preview", { method: "POST" }), {
      params: { id: "c1" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toEqual({ sent: 1, failed: 0, total: 1 });
    expect(runCampaignSendMock).toHaveBeenCalledWith("c1", { previewUserId: "admin-1" });
  });

  it("POST preview returns 404 when campaign missing", async () => {
    runCampaignSendMock.mockRejectedValue(new Error("Campaña no encontrada"));

    const res = await POST(new Request("http://localhost/api/admin/campaigns/missing/preview", { method: "POST" }), {
      params: { id: "missing" },
    });

    expect(res.status).toBe(404);
  });
});
