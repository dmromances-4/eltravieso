import { createHash } from "crypto";
import * as Sentry from "@sentry/nextjs";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getRequestContext } from "@/lib/observability/request-context";
import { logger } from "@/lib/observability/logger";
import { redactMetadata } from "@/lib/observability/logger";
import { isSentryEnabled } from "@/lib/sentry/options";

export type AuditEventInput = {
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: Request;
};

export function hashAuditIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 12);
}

function resolveAuditFields(input: AuditEventInput) {
  const ctx = getRequestContext();
  const request = input.request;

  return {
    action: input.action,
    actorId: input.actorId ?? ctx?.userId ?? null,
    actorEmail: input.actorEmail ?? null,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    requestId: input.requestId ?? ctx?.requestId ?? request?.headers.get("x-request-id") ?? null,
    ip: input.ip ?? ctx?.ip ?? request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: input.userAgent ?? ctx?.userAgent ?? request?.headers.get("user-agent") ?? null,
    metadata: input.metadata ? redactMetadata(input.metadata) : null,
  };
}

export async function auditEvent(input: AuditEventInput): Promise<void> {
  const fields = resolveAuditFields(input);

  logger.info("audit.event", {
    scope: "audit",
    action: fields.action,
    userId: fields.actorId ?? undefined,
    requestId: fields.requestId ?? undefined,
    metadata: {
      resourceType: fields.resourceType,
      resourceId: fields.resourceId,
      ...((fields.metadata as Record<string, unknown> | null) ?? {}),
    },
  });

  if (isSentryEnabled()) {
    Sentry.addBreadcrumb({
      category: "audit",
      message: fields.action,
      level: "info",
      data: {
        actorId: fields.actorId,
        resourceType: fields.resourceType,
        resourceId: fields.resourceId,
        requestId: fields.requestId,
      },
    });
  }

  try {
    await prisma.auditLog.create({
      data: {
        action: fields.action,
        actorId: fields.actorId,
        actorEmail: fields.actorEmail,
        resourceType: fields.resourceType,
        resourceId: fields.resourceId,
        requestId: fields.requestId,
        ip: fields.ip,
        userAgent: fields.userAgent,
        metadata: (fields.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  } catch (error) {
    logger.error("audit.persist_failed", {
      scope: "audit",
      action: fields.action,
      requestId: fields.requestId ?? undefined,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

export async function auditAdminAction(
  admin: { id: string; email: string },
  action: string,
  options: Omit<AuditEventInput, "action" | "actorId" | "actorEmail"> = {},
): Promise<void> {
  await auditEvent({
    ...options,
    action,
    actorId: admin.id,
    actorEmail: admin.email,
  });
}
