"use client";

import * as Sentry from "@sentry/nextjs";

export function getSentryTraceQuery(): Record<string, string> {
  try {
    const traceData = Sentry.getTraceData?.();
    if (!traceData) return {};

    const query: Record<string, string> = {};
    if (traceData["sentry-trace"]) {
      query["sentry-trace"] = traceData["sentry-trace"];
    }
    if (traceData.baggage) {
      query.baggage = traceData.baggage;
    }
    return query;
  } catch {
    return {};
  }
}

export function buildBarOnlineHandshakeQuery(requestId?: string): Record<string, string> {
  return {
    ...getSentryTraceQuery(),
    ...(requestId ? { "x-request-id": requestId } : {}),
  };
}
