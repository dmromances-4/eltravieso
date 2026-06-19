import createMiddleware from "next-intl/middleware";
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdmin2faRequired } from "@/lib/auth/admin-2fa-policy";
import { routing } from "@/i18n/routing";
import { stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/locale";

const intlMiddleware = createMiddleware(routing);

function ensureRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

function withRequestIdHeaders(request: NextRequest, requestId: string): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  return requestHeaders;
}

function attachRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  return response;
}

function isAdminPath(pathname: string): boolean {
  return stripLocalePrefix(pathname).startsWith("/admin");
}

function localizedPath(pathname: string, locale: string, request: NextRequest): URL {
  const stripped = stripLocalePrefix(pathname);
  const target = withLocalePrefix(stripped, locale as "es" | "en");
  return new URL(target, request.url);
}

async function handleAdminAuth(request: NextRequest, requestId: string): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  if (!isAdminPath(pathname)) return null;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const locale = pathname.startsWith("/en/") ? "en" : routing.defaultLocale;

  if (!token?.id || token.role !== "ADMIN") {
    const login = localizedPath("/login", locale, request);
    login.searchParams.set("callbackUrl", pathname);
    login.searchParams.set("admin", "1");
    return attachRequestId(NextResponse.redirect(login), requestId);
  }

  if (isAdmin2faRequired()) {
    if (!token.isTwoFactorEnabled) {
      const setup = localizedPath("/setup-2fa", locale, request);
      setup.searchParams.set("require", "admin");
      setup.searchParams.set("callbackUrl", pathname);
      return attachRequestId(NextResponse.redirect(setup), requestId);
    }

    if (!token.twoFactorVerified) {
      const login = localizedPath("/login", locale, request);
      login.searchParams.set("callbackUrl", pathname);
      login.searchParams.set("admin", "1");
      login.searchParams.set("error", "2fa");
      return attachRequestId(NextResponse.redirect(login), requestId);
    }
  }

  return null;
}

export default async function middleware(request: NextRequest) {
  const requestId = ensureRequestId(request);
  const requestHeaders = withRequestIdHeaders(request, requestId);

  const adminResponse = await handleAdminAuth(request, requestId);
  if (adminResponse) return adminResponse;

  const intlRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
  });

  const response = intlMiddleware(intlRequest);
  return attachRequestId(response, requestId);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/admin/:path*",
    "/en/admin/:path*",
  ],
};
