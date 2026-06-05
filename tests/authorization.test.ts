import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertWholesaleDispatchAccess,
  AuthorizationError,
} from "@/lib/security/authorization";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("assertWholesaleDispatchAccess", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("blocks USER role", async () => {
    findUniqueMock.mockResolvedValue({ role: "USER" });

    await expect(assertWholesaleDispatchAccess("u1", "owner-1")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("allows ADMIN for any bar", async () => {
    findUniqueMock.mockResolvedValue({ role: "ADMIN" });

    const role = await assertWholesaleDispatchAccess("admin-1", "other-owner");
    expect(role).toBe("ADMIN");
  });

  it("allows WHOLESALER for any bar", async () => {
    findUniqueMock.mockResolvedValue({ role: "WHOLESALER" });

    const role = await assertWholesaleDispatchAccess("wh-1", "other-owner");
    expect(role).toBe("WHOLESALER");
  });

  it("allows BAR_OWNER only for own bar", async () => {
    findUniqueMock.mockResolvedValue({ role: "BAR_OWNER" });

    await expect(assertWholesaleDispatchAccess("owner-1", "other-owner")).rejects.toBeInstanceOf(
      AuthorizationError,
    );

    const role = await assertWholesaleDispatchAccess("owner-1", "owner-1");
    expect(role).toBe("BAR_OWNER");
  });

  it("returns 401 when user not found", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(assertWholesaleDispatchAccess("ghost", "owner")).rejects.toMatchObject({
      status: 401,
    });
  });
});
