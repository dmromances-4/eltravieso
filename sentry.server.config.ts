import * as Sentry from "@sentry/nextjs";
import { getBaseNodeOptions } from "./lib/sentry/options";
import { beforeSendEvent } from "./lib/observability/sentry-redact";

Sentry.init(
  getBaseNodeOptions({
    beforeSend: beforeSendEvent,
  }),
);
