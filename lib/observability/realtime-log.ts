import { logger } from "@/lib/observability/logger";

export function logRealtimeEvent(
  level: "info" | "warn" | "error",
  message: string,
  metadata: Record<string, unknown> = {},
): void {
  logger[level](message, {
    scope: "bar-online-realtime",
    metadata,
  });
}

export function withSocketHandler<T extends unknown[]>(
  eventName: string,
  handler: (...args: T) => void | Promise<void>,
  capture: (error: unknown, context: { eventName: string }) => void,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (error) {
      capture(error, { eventName });
      throw error;
    }
  };
}
