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
  const configured = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (configured != null && configured !== "") {
    const parsed = Number(configured);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }
  return process.env.NODE_ENV === "production" ? 0.1 : 1.0;
}

export function getProfilesSampleRate(): number | undefined {
  const configured = process.env.SENTRY_PROFILES_SAMPLE_RATE;
  if (configured == null || configured === "") return undefined;
  const parsed = Number(configured);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) return undefined;
  return parsed;
}

export function getBaseNodeOptions(overrides?: Partial<NodeOptions>): NodeOptions {
  const profilesSampleRate = getProfilesSampleRate();
  return {
    dsn: process.env.SENTRY_DSN,
    enabled: isSentryEnabled(),
    environment: getSentryEnvironment(),
    tracesSampleRate: getTracesSampleRate(),
    ...(profilesSampleRate != null ? { profilesSampleRate } : {}),
    ...overrides,
  };
}
