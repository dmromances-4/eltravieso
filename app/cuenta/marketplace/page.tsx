import { getCurrentUser } from "@/lib/auth/session";
import ListingForm from "@/components/marketplace/ListingForm";

export const dynamic = "force-dynamic";

export default async function AccountMarketplacePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Vender en el marketplace</h1>
        <p className="mt-2 text-slate-400">
          Sube tus propios artículos (cristalería, material, ropa, siropes...). Pasarán por revisión antes de publicarse.
        </p>
      </div>
      <ListingForm />
    </div>
  );
}
