import { getAllAlcohols } from '@/lib/alcohol/catalog';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRequestLocaleFromHeaders } from '@/lib/i18n/request-locale';

export async function GET(request: NextRequest) {
  const locale = getRequestLocaleFromHeaders(request);
  return NextResponse.json(getAllAlcohols(locale));
}
