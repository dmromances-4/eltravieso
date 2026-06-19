import * as Sentry from "@sentry/node";
import { getBaseNodeOptions } from "./options";
import { beforeSendEvent } from "../observability/sentry-redact";

let initialized = false;

export function initRealtimeSentry() {
  if (initialized) return;
  initialized = true;

  Sentry.init(
    getBaseNodeOptions({
      initialScope: {
        tags: { service: "bar-online-realtime" },
      },
      beforeSend: beforeSendEvent,
    }),
  );

  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
  });

  process.on("uncaughtException", (error) => {
    Sentry.captureException(error);
    Sentry.flush(2000).finally(() => process.exit(1));
  });
}

export { Sentry };
