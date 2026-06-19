export function getTracePropagationHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const headers: Record<string, string> = {};
  const requestId = document.querySelector('meta[name="x-request-id"]')?.getAttribute("content");
  if (requestId) {
    headers["x-request-id"] = requestId;
  }

  return headers;
}

export function buildSocketHandshakeQuery(extra: Record<string, string> = {}): Record<string, string> {
  const query: Record<string, string> = { ...extra };

  if (typeof document !== "undefined") {
    const requestId = document.querySelector('meta[name="x-request-id"]')?.getAttribute("content");
    if (requestId) {
      query["x-request-id"] = requestId;
    }
  }

  return query;
}

export function parseIncomingTraceHeaders(
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | undefined> = {},
): { sentryTrace?: string; baggage?: string; requestId?: string } {
  const sentryTrace =
    (typeof headers["sentry-trace"] === "string" ? headers["sentry-trace"] : undefined) ??
    query["sentry-trace"];
  const baggage =
    (typeof headers.baggage === "string" ? headers.baggage : undefined) ?? query.baggage;
  const requestId =
    (typeof headers["x-request-id"] === "string" ? headers["x-request-id"] : undefined) ??
    query["x-request-id"];

  return { sentryTrace, baggage, requestId };
}

export function continueTraceFromHeaders<T>(
  sentry: {
    continueTrace: (
      context: { sentryTrace?: string; baggage?: string },
      callback: () => T,
    ) => T;
  },
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | undefined>,
  fn: () => T,
): T {
  const { sentryTrace, baggage } = parseIncomingTraceHeaders(headers, query);
  if (!sentryTrace && !baggage) {
    return fn();
  }
  return sentry.continueTrace({ sentryTrace, baggage }, fn);
}
