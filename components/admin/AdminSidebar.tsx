"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import MobileNavSheet from "@/components/ui/MobileNavSheet";
import LogoutButton from "@/components/LogoutButton";
import { isAdmin2faRequired } from "@/lib/auth/admin-2fa-policy";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

export default function AdminSidebar({ userName, userEmail }: Props) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: t("dashboard"), exact: true },
    { href: "/admin/products", label: t("products") },
    { href: "/admin/marketplace", label: t("marketplace") },
    { href: "/admin/wholesale", label: t("wholesale") },
    { href: "/admin/production", label: t("production") },
    { href: "/admin/recipes", label: t("recipes") },
    { href: "/admin/recipe-covers", label: t("recipeCovers") },
    { href: "/admin/recetas-auditoria", label: t("recipeAudit") },
    { href: "/admin/pantalla", label: t("screen") },
    { href: "/admin/posts", label: t("posts") },
    { href: "/admin/campaigns", label: t("campaigns") },
    { href: "/admin/vip-drops", label: t("vipDrops") },
    { href: "/admin/delivery", label: t("delivery") },
    { href: "/admin/tax-registry", label: t("tax") },
    { href: "/admin/forum", label: t("forum") },
  ];

  const sidebarHeader = (
    <div className="p-6">
      <Link
        href="/admin"
        className="font-display text-xl font-bold tracking-tight text-white transition-colors hover:text-electric-yellow"
      >
        El Travieso <span className="text-electric-yellow">{t("title")}</span>
      </Link>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
        {isAdmin2faRequired() ? "2FA" : "Admin"}
      </p>
    </div>
  );

  const nav = (
    <nav className="flex-1 space-y-2 overflow-y-auto px-4">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${
              active
                ? "bg-electric-yellow/10 text-electric-yellow"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4">
      <div className="mb-4 px-4">
        <p className="text-sm font-medium text-white">{userName}</p>
        <p className="text-xs text-slate-500">{userEmail}</p>
      </div>
      <LogoutButton />
    </div>
  );

  return (
    <>
      <MobileNavSheet
        title={t("menu")}
        triggerLabel={t("menu")}
        pathname={pathname}
        items={links}
        footer={<LogoutButton />}
      />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#121212] lg:flex">
        {sidebarHeader}
        {nav}
        {footer}
      </aside>
    </>
  );
}
