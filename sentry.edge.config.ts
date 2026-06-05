import * as Sentry from "@sentry/nextjs";
import { getSentryEnvironment, getTracesSampleRate, isSentryEnabled } from "./lib/sentry/options";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: isSentryEnabled(),
  environment: getSentryEnvironment(),
  tracesSampleRate: getTracesSampleRate(),
});
