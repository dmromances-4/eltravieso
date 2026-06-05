import * as Sentry from "@sentry/nextjs";
import { getBaseNodeOptions } from "./lib/sentry/options";

Sentry.init(getBaseNodeOptions());
