import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry/options";

export function clientSafeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== "production") {
    return error instanceof Error ? error.message : fallback;
  }
  return fallback;
}

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  if (isSentryEnabled()) {
    Sentry.withScope((sentryScope) => {
      sentryScope.setTag("scope", scope);
      Sentry.captureException(error);
    });
  }
}
