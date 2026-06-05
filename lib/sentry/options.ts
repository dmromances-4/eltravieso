import type { NodeOptions } from "@sentry/node";

export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function getTracesSampleRate(): number {
  return process.env.NODE_ENV === "production" ? 0.1 : 1.0;
}

export function getBaseNodeOptions(overrides?: Partial<NodeOptions>): NodeOptions {
  return {
    dsn: process.env.SENTRY_DSN,
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    tracesSampleRate: getTracesSampleRate(),
    ...overrides,
  };
}
