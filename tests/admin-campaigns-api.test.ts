import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/admin/campaigns/route";

const { requireAdminMock, campaignFindManyMock, campaignCreateMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  campaignFindManyMock: vi.fn(),
  campaignCreateMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin-api", () => ({
  requireAdminUser: requireAdminMock,
  adminApiErrorResponse: (error: unknown) =>
    new Response(JSON.stringify({ message: error instanceof Error ? error.message : "Error" }), {
      status: 403,
    }),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    campaign: {
      findMany: campaignFindManyMock,
      create: campaignCreateMock,
    },
  },
}));

describe("admin campaigns API", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    campaignFindManyMock.mockReset();
    campaignCreateMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: "admin-1", email: "admin@test.com", role: "ADMIN" });
  });

  it("GET lists campaigns for admin", async () => {
    campaignFindManyMock.mockResolvedValue([
      {
        id: "c1",
        name: "Test",
        channel: "EMAIL",
        status: "DRAFT",
        subject: "Hi",
        bodyText: "Body",
        bodyHtml: null,
        audience: {},
        scheduledAt: null,
        sentAt: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        _count: { messages: 0 },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaigns).toHaveLength(1);
  });

  it("POST rejects invalid payload", async () => {
    const req = new Request("http://localhost/api/admin/campaigns", {
      method: "POST",
      body: JSON.stringify({ name: "", channel: "EMAIL", bodyText: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST creates draft campaign", async () => {
    campaignCreateMock.mockResolvedValue({
      id: "c2",
      name: "Promo",
      channel: "SMS",
      status: "DRAFT",
      subject: null,
      bodyText: "Hola",
      bodyHtml: null,
      audience: {},
      scheduledAt: null,
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { messages: 0 },
    });

    const req = new Request("http://localhost/api/admin/campaigns", {
      method: "POST",
      body: JSON.stringify({ name: "Promo", channel: "SMS", bodyText: "Hola" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
