import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AdminApiError, adminApiErrorResponse } from "@/lib/auth/admin-api";
import { evaluateAdminAccess } from "@/lib/auth/admin-access";

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

describe("AdminApiError", () => {
  it("carries status and reason", () => {
    const err = new AdminApiError("2FA obligatorio para administradores", 403, "2fa_not_enabled");
    expect(err.status).toBe(403);
    expect(err.reason).toBe("2fa_not_enabled");
  });
});

describe("adminApiErrorResponse", () => {
  it("maps AdminApiError to JSON response", async () => {
    const res = adminApiErrorResponse(
      new AdminApiError("Verificación 2FA requerida", 403, "2fa_not_verified"),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Verificación 2FA requerida");
  });

  it("maps legacy UNAUTHORIZED message", async () => {
    const res = adminApiErrorResponse(new Error("UNAUTHORIZED"));
    expect(res.status).toBe(401);
  });

  it("defaults unknown errors to 500", async () => {
    const res = adminApiErrorResponse(new Error("db down"));
    expect(res.status).toBe(500);
  });
});

describe("evaluateAdminAccess (admin API 2FA gate)", () => {
  const originalAdminRequire2fa = process.env.ADMIN_REQUIRE_2FA;

  beforeEach(() => {
    findUniqueMock.mockReset();
    process.env.ADMIN_REQUIRE_2FA = "true";
  });

  afterEach(() => {
    if (originalAdminRequire2fa === undefined) {
      delete process.env.ADMIN_REQUIRE_2FA;
    } else {
      process.env.ADMIN_REQUIRE_2FA = originalAdminRequire2fa;
    }
  });

  it("denies admin session without 2FA enabled when required", async () => {
    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      isTwoFactorEnabled: false,
    });

    const access = await evaluateAdminAccess({
      user: { id: "admin-1", role: "ADMIN", twoFactorVerified: true },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    } as never);

    expect(access.allowed).toBe(false);
    if (!access.allowed) {
      expect(access.reason).toBe("2fa_not_enabled");
    }
  });

  it("allows admin session without 2FA when ADMIN_REQUIRE_2FA=false", async () => {
    process.env.ADMIN_REQUIRE_2FA = "false";

    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      isTwoFactorEnabled: false,
    });

    const access = await evaluateAdminAccess({
      user: { id: "admin-1", role: "ADMIN", twoFactorVerified: false },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    } as never);

    expect(access.allowed).toBe(true);
    if (access.allowed) {
      expect(access.userId).toBe("admin-1");
    }
  });
});
