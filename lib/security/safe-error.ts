import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry/options";
import { getRequestContext } from "@/lib/observability/request-context";
import { logger } from "@/lib/observability/logger";

export type ServerErrorContext = {
  userId?: string;
  path?: string;
  requestId?: string;
  extra?: Record<string, unknown>;
};

export function clientSafeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== "production") {
    return error instanceof Error ? error.message : fallback;
  }
  return fallback;
}

export function logServerError(scope: string, error: unknown, context: ServerErrorContext = {}) {
  const requestContext = getRequestContext();
  const requestId = context.requestId ?? requestContext?.requestId;
  const userId = context.userId ?? requestContext?.userId;
  const path = context.path ?? requestContext?.path;

  logger.error(error instanceof Error ? error.message : String(error), {
    scope,
    requestId,
    userId,
    metadata: {
      path,
      ...context.extra,
      ...(error instanceof Error ? { name: error.name, stack: error.stack } : { error }),
    },
  });

  if (isSentryEnabled()) {
    Sentry.withScope((sentryScope) => {
      sentryScope.setTag("scope", scope);
      if (requestId) sentryScope.setTag("requestId", requestId);
      if (userId) sentryScope.setTag("userId", userId);
      if (path) sentryScope.setTag("path", path);
      if (context.extra) {
        for (const [key, value] of Object.entries(context.extra)) {
          sentryScope.setExtra(key, value);
        }
      }
      Sentry.captureException(error);
    });
  }
}
