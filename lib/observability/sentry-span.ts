import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry/options";

export async function withSentrySpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  if (!isSentryEnabled()) {
    return fn();
  }

  return Sentry.startSpan(
    {
      name,
      op,
      attributes: Object.fromEntries(
        Object.entries(attributes ?? {}).filter(([, value]) => value !== undefined),
      ) as Record<string, string | number | boolean>,
    },
    fn,
  );
}
