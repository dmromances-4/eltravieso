import { beforeEach, describe, expect, it, vi } from "vitest";
import { canJoinBarOnlineRoom, resolveMaxUsersForHost } from "@/lib/realtime/room-access";

const { findFirstMock, findUniqueMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    barOnlineSession: { findFirst: findFirstMock },
    user: { findUnique: findUniqueMock },
  },
}));

describe("bar-online room access", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("allows host always", async () => {
    findFirstMock.mockResolvedValue({
      hostId: "host-1",
      isPrivate: true,
      maxUsers: 10,
      participants: [],
    });

    expect(await canJoinBarOnlineRoom("host-1", "room-1")).toBe(true);
  });

  it("blocks non-vip from private room", async () => {
    findFirstMock.mockResolvedValue({
      hostId: "host-1",
      isPrivate: true,
      maxUsers: 10,
      participants: [],
    });
    findUniqueMock.mockResolvedValue({ membershipStatus: "NONE", membershipExpiresAt: null });

    expect(await canJoinBarOnlineRoom("guest-1", "room-1")).toBe(false);
  });

  it("caps max users by tier", () => {
    expect(resolveMaxUsersForHost(false, 99)).toBe(10);
    expect(resolveMaxUsersForHost(true, 99)).toBe(50);
  });
});
