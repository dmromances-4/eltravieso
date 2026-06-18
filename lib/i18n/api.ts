import { NextResponse } from "next/server";
import type { AppLocale } from "@/i18n/routing";
import { getApiMessage, type ApiErrorKey } from "@/lib/i18n/errors";
import { getRequestLocaleFromHeaders } from "@/lib/i18n/request-locale";

export async function jsonError(
  request: Request,
  key: ApiErrorKey,
  status = 400,
  extra?: Record<string, unknown>,
) {
  const locale = getRequestLocaleFromHeaders(request);
  const message = await getApiMessage(locale, key);
  return NextResponse.json({ message, error: key, ...extra }, { status });
}

export async function jsonMessage(
  request: Request,
  key: ApiErrorKey,
  status = 200,
  extra?: Record<string, unknown>,
) {
  const locale = getRequestLocaleFromHeaders(request);
  const message = await getApiMessage(locale, key);
  return NextResponse.json({ message, ...extra }, { status });
}

export function jsonErrorLocale(
  locale: AppLocale,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ message, ...extra }, { status });
}
