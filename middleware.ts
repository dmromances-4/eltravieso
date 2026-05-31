import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIX = "/admin";

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id || token.role !== "ADMIN") {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    login.searchParams.set("admin", "1");
    return NextResponse.redirect(login);
  }

  if (!token.isTwoFactorEnabled) {
    const setup = new URL("/setup-2fa", request.url);
    setup.searchParams.set("require", "admin");
    setup.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(setup);
  }

  if (!token.twoFactorVerified) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    login.searchParams.set("admin", "1");
    login.searchParams.set("error", "2fa");
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
