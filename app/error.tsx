"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import RouteError from "@/components/ui/RouteError";
import { isSentryEnabled } from "@/lib/sentry/options";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isSentryEnabled()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return <RouteError error={error} reset={reset} />;
}
