import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AccountSidebar from "@/components/account/AccountSidebar";
import { getAuthSession } from "@/lib/auth/session";

export const metadata = {
  title: "Mi cuenta | El Travieso",
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=/cuenta");
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-28 pb-20 text-white">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <AccountSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
