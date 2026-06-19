import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { createSubscriptionCheckout } from "@/lib/stripe/api";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { clientSafeErrorMessage, logServerError } from "@/lib/security/safe-error";
import { jsonError } from "@/lib/i18n/api";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return jsonError(request, "loginRequired", 401);
  }

  const priceId = process.env.STRIPE_VIP_PRICE_ID;
  if (!priceId) {
    return jsonError(request, "server", 503);
  }

  try {
    const customerId = await getOrCreateStripeCustomer(session.user.id);
    const checkout = await createSubscriptionCheckout({
      customerId,
      priceId,
      metadata: {
        billingType: "vip",
        userId: session.user.id,
      },
      successPath: "/cuenta/membresia",
      cancelPath: "/cuenta/membresia",
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    logServerError("billing-vip", error);
    return jsonError(request, "paymentFailed", 500, {
      detail: clientSafeErrorMessage(error, "paymentFailed"),
    });
  }
}
