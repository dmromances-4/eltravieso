"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry/options";

export default function GlobalError({
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

  return (
    <html lang="es">
      <body>
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Algo ha ido mal</h1>
          <p>Ha ocurrido un error inesperado. Inténtalo de nuevo.</p>
          <button type="button" onClick={() => reset()}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
