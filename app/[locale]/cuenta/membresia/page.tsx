import { redirect } from "next/navigation";
import MembresiaClient from "@/components/account/MembresiaClient";
import { getCurrentUser } from "@/lib/auth/session";
import { isActiveVip } from "@/lib/membership/entitlements";
import { isStripeConfigured } from "@/lib/stripe/api";

export const dynamic = "force-dynamic";

export default async function MembresiaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cuenta/membresia");

  const paymentsEnabled = isStripeConfigured() && Boolean(process.env.STRIPE_VIP_PRICE_ID?.trim());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-widest text-white">Club de la Trastienda</h1>
        <p className="mt-2 font-mono text-sm text-slate-400">
          Membresía mensual con ventajas en Bar Online, drops exclusivos y contenido premium.
        </p>
      </div>
      <MembresiaClient
        membershipStatus={user.membershipStatus}
        membershipExpiresAt={user.membershipExpiresAt?.toISOString() ?? null}
        isVip={isActiveVip(user)}
        hasStripeCustomer={Boolean(user.stripeCustomerId)}
        paymentsEnabled={paymentsEnabled}
      />
    </div>
  );
}
