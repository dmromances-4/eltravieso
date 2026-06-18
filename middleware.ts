import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdmin2faRequired } from "@/lib/auth/admin-2fa-policy";
import { routing } from "@/i18n/routing";
import { stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/locale";

const intlMiddleware = createMiddleware(routing);

function isAdminPath(pathname: string): boolean {
  return stripLocalePrefix(pathname).startsWith("/admin");
}

function localizedPath(pathname: string, locale: string, request: NextRequest): URL {
  const stripped = stripLocalePrefix(pathname);
  const target = withLocalePrefix(stripped, locale as "es" | "en");
  return new URL(target, request.url);
}

async function handleAdminAuth(request: NextRequest): Promise<NextResponse | null> {
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
    return NextResponse.redirect(login);
  }

  if (isAdmin2faRequired()) {
    if (!token.isTwoFactorEnabled) {
      const setup = localizedPath("/setup-2fa", locale, request);
      setup.searchParams.set("require", "admin");
      setup.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(setup);
    }

    if (!token.twoFactorVerified) {
      const login = localizedPath("/login", locale, request);
      login.searchParams.set("callbackUrl", pathname);
      login.searchParams.set("admin", "1");
      login.searchParams.set("error", "2fa");
      return NextResponse.redirect(login);
    }
  }

  return null;
}

export default async function middleware(request: NextRequest) {
  const adminResponse = await handleAdminAuth(request);
  if (adminResponse) return adminResponse;

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/admin/:path*",
    "/en/admin/:path*",
  ],
};
