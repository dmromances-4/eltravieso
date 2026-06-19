import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/api";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { createPendingOrder } from "@/lib/checkout/create-order";
import {
  CartValidationError,
  cartHasMarketplaceItems,
  toCheckoutItems,
  validateCartLines,
} from "@/lib/checkout/validate-cart";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { buildRequestContext, mergeRequestContext, runWithRequestContext } from "@/lib/observability/request-context";
import { withSentrySpan } from "@/lib/observability/sentry-span";
import { auditEvent } from "@/lib/observability/audit";
import { clientSafeErrorMessage, logServerError } from "@/lib/security/safe-error";
import { getAuthSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/i18n/api";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  return runWithRequestContext(buildRequestContext(request), async () => {
  const limited = await enforceRateLimit(request, "checkout", RATE_LIMITS.checkout);
  if (limited) {
    return NextResponse.json({ error: limited.message }, { status: limited.status, headers: limited.headers });
  }

  let body: { items?: unknown; email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(request, "invalidBody", 400);
  }

  const session = await getAuthSession();
  if (session?.user?.id) {
    mergeRequestContext({ userId: session.user.id });
  }
  const emailFromBody = typeof body.email === "string" ? body.email.trim() : "";
  const email = session?.user?.email ?? emailFromBody;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError(request, "invalidEmail", 400);
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return jsonError(request, "paymentsDisabled", 503);
  }

  try {
    const lines = await withSentrySpan("checkout.validate_cart", "checkout", () =>
      validateCartLines(body.items as { id: string; quantity: number }[]),
    );

    if (cartHasMarketplaceItems(lines) && !session?.user?.id) {
      return jsonError(request, "marketplaceLoginRequired", 401);
    }

    const order = await withSentrySpan("checkout.create_order", "checkout", () =>
      createPendingOrder({
        userId: session?.user?.id ?? null,
        guestEmail: email,
        lines,
      }),
    );

    let customerId: string | undefined;
    if (session?.user?.id) {
      customerId = await withSentrySpan("checkout.stripe_customer", "checkout", () =>
        getOrCreateStripeCustomer(session.user!.id!),
      );
    }

    const stripeSession = await withSentrySpan("checkout.stripe_session", "checkout", () =>
      createCheckoutSession(toCheckoutItems(lines), email, {
        customerId,
        orderId: order.id,
      }),
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: stripeSession.id },
    });

    void auditEvent({
      action: "checkout.session.created",
      actorId: session?.user?.id ?? null,
      resourceType: "Order",
      resourceId: order.id,
      request,
      metadata: { stripeSessionId: stripeSession.id },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    if (error instanceof CartValidationError) {
      return NextResponse.json({ error: error.message, message: error.message }, { status: error.status });
    }
    logServerError("checkout", error, { path: new URL(request.url).pathname, userId: session?.user?.id ?? undefined });
    const message = clientSafeErrorMessage(error, "paymentFailed");
    return jsonError(request, "paymentFailed", 500, { detail: message });
  }
  });
}
