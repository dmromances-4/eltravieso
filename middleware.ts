import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdmin2faRequired } from "@/lib/auth/admin-2fa-policy";

const ADMIN_PREFIX = "/admin";

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

export async function middleware(request: NextRequest) {
  const requestId = ensureRequestId(request);
  const requestHeaders = withRequestIdHeaders(request, requestId);

  const nextWithRequestId = () =>
    attachRequestId(
      NextResponse.next({
        request: { headers: requestHeaders },
      }),
      requestId,
    );

  if (!request.nextUrl.pathname.startsWith(ADMIN_PREFIX)) {
    return nextWithRequestId();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id || token.role !== "ADMIN") {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    login.searchParams.set("admin", "1");
    return attachRequestId(NextResponse.redirect(login), requestId);
  }

  if (isAdmin2faRequired()) {
    if (!token.isTwoFactorEnabled) {
      const setup = new URL("/setup-2fa", request.url);
      setup.searchParams.set("require", "admin");
      setup.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return attachRequestId(NextResponse.redirect(setup), requestId);
    }

    if (!token.twoFactorVerified) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", request.nextUrl.pathname);
      login.searchParams.set("admin", "1");
      login.searchParams.set("error", "2fa");
      return attachRequestId(NextResponse.redirect(login), requestId);
    }
  }

  return nextWithRequestId();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
