import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminAccessRedirect, evaluateAdminAccess } from "@/lib/auth/admin-access";
import { getLocale } from "next-intl/server";
import { withLocalePrefix } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const access = await evaluateAdminAccess(session);
  const locale = await getLocale();

  if (!access.allowed) {
    redirect(withLocalePrefix(adminAccessRedirect(access.reason), locale as "es" | "en"));
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A] pt-20 md:flex-row">
      <AdminSidebar userName={session?.user?.name} userEmail={session?.user?.email} />
      <main className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6 text-white md:p-10">{children}</main>
    </div>
  );
}
