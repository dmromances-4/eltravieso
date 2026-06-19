import { maskSecret } from "@/lib/security/redact";
import { getRequestContext } from "@/lib/observability/request-context";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = {
  scope?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|api[_-]?key|credential/i;

function redactValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  if (SENSITIVE_KEY.test(key)) {
    if (typeof value === "string") return maskSecret(value) ?? "[redacted]";
    return "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(`${key}.${index}`, item));
  }
  if (typeof value === "object") {
    return redactMetadata(value as Record<string, unknown>);
  }
  return value;
}

export function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    output[key] = redactValue(key, value);
  }
  return output;
}

function shouldLog(level: LogLevel): boolean {
  if (level === "debug") return process.env.NODE_ENV !== "production";
  return true;
}

export function logStructured(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (!shouldLog(level)) return;

  const ctx = getRequestContext();
  const payload = {
    level,
    ts: new Date().toISOString(),
    message,
    requestId: fields.requestId ?? ctx?.requestId,
    scope: fields.scope,
    action: fields.action,
    userId: fields.userId ?? ctx?.userId,
    metadata: fields.metadata ? redactMetadata(fields.metadata) : undefined,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => logStructured("debug", message, fields),
  info: (message: string, fields?: LogFields) => logStructured("info", message, fields),
  warn: (message: string, fields?: LogFields) => logStructured("warn", message, fields),
  error: (message: string, fields?: LogFields) => logStructured("error", message, fields),
};
