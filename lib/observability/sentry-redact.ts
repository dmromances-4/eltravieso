import type { ErrorEvent, Event } from "@sentry/node";
import { maskSecret } from "@/lib/security/redact";

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|api[_-]?key|credential/i;

function redactUnknown(value: unknown, key = ""): unknown {
  if (value == null || typeof value !== "object") {
    if (typeof value === "string" && SENSITIVE_KEY.test(key)) {
      return maskSecret(value) ?? "[redacted]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactUnknown(item, `${key}.${index}`));
  }

  const output: Record<string, unknown> = {};
  for (const [nestedKey, nested] of Object.entries(value as Record<string, unknown>)) {
    output[nestedKey] = redactUnknown(nested, nestedKey);
  }
  return output;
}

export function redactSentryEvent<T extends Event>(event: T): T {
  if (event.request?.headers) {
    event.request.headers = redactUnknown(event.request.headers) as Record<string, string>;
  }
  if (event.extra) {
    event.extra = redactUnknown(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = redactUnknown(event.contexts) as typeof event.contexts;
  }
  return event;
}

export function beforeSendEvent(event: ErrorEvent): ErrorEvent | null {
  return redactSentryEvent(event);
}
