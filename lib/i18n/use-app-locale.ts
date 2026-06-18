"use client";

import { useLocale } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

export function useAppLocale(): AppLocale {
  return useLocale() as AppLocale;
}
