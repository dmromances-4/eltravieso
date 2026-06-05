import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCampaignRecipients } from "@/lib/marketing/consent";

const { userFindManyMock } = vi.hoisted(() => ({
  userFindManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: userFindManyMock,
    },
  },
}));

describe("resolveCampaignRecipients", () => {
  beforeEach(() => {
    userFindManyMock.mockReset();
  });

  it("returns email recipients with opt-in and email address", async () => {
    userFindManyMock.mockResolvedValue([
      { id: "u1", email: "a@test.com", phone: null, name: "A" },
      { id: "u2", email: null, phone: "+34600000000", name: "B" },
    ]);

    const recipients = await resolveCampaignRecipients("EMAIL", {});
    expect(recipients).toEqual([{ userId: "u1", email: "a@test.com", phone: null, name: "A" }]);
    expect(userFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          marketingConsent: { emailOptIn: true },
        }),
      }),
    );
  });

  it("returns sms recipients with opt-in and phone", async () => {
    userFindManyMock.mockResolvedValue([
      { id: "u1", email: "a@test.com", phone: "+34600000000", name: "A" },
      { id: "u2", email: "b@test.com", phone: null, name: "B" },
    ]);

    const recipients = await resolveCampaignRecipients("SMS", {});
    expect(recipients).toEqual([
      { userId: "u1", email: "a@test.com", phone: "+34600000000", name: "A" },
    ]);
    expect(userFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          marketingConsent: { smsOptIn: true },
        }),
      }),
    );
  });

  it("filters by audience roles when provided", async () => {
    userFindManyMock.mockResolvedValue([]);

    await resolveCampaignRecipients("WHATSAPP", { roles: ["USER"] });
    expect(userFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: { in: ["USER"] },
          marketingConsent: { whatsappOptIn: true },
        }),
      }),
    );
  });
});
