"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";
import MobileNavSheet from "@/components/ui/MobileNavSheet";

export default function AccountSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("account");
  const tNav = useTranslations("nav");

  const links = [
    { href: "/cuenta", label: t("title"), exact: true },
    { href: "/cuenta/configuracion", label: t("profile") },
    { href: "/cuenta/seguridad", label: t("security") },
    ...(session?.user?.role === "ADMIN" || session?.user?.role === "BAR_OWNER"
      ? [
          { href: "/cuenta/bar", label: t("bar") },
          { href: "/cuenta/bar/eventos", label: t("events") },
        ]
      : []),
    { href: "/cuenta/membresia", label: t("membership") },
    { href: "/cuenta/recetas", label: t("recipes") },
    { href: "/cuenta/blog", label: t("blog") },
    { href: "/cuenta/marketplace", label: t("marketplace") },
    ...(session?.user?.role === "ADMIN" || session?.user?.role === "BAR_OWNER"
      ? [{ href: "/cuenta/integraciones", label: t("integrations") }]
      : []),
  ];

  const profileHeader = (
    <div className="mb-6 border-b border-white/10 pb-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-electric-yellow/30 bg-[#0f0f0f]">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? t("title")}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-electric-yellow">
              {(session?.user?.name || session?.user?.email || "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-caption text-electric-blue">{t("title")}</p>
          <p className="mt-1 truncate font-display text-lg font-semibold text-white">
            {session?.user?.name || t("title")}
          </p>
        </div>
      </div>
      <p className="truncate text-sm text-slate-400">{session?.user?.email}</p>
      {session?.user?.role === "ADMIN" ? (
        <Link
          href="/admin"
          className="mt-3 inline-flex text-sm font-medium text-electric-blue hover:text-white"
        >
          {tNav("admin")} →
        </Link>
      ) : null}
    </div>
  );

  const navLinks = (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-card px-4 py-3 text-sm font-medium transition ${
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

  const logoutButton = (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="mt-6 w-full rounded-pill border border-white/10 px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-electric-red/40 hover:text-electric-red"
    >
      {tNav("logout")}
    </button>
  );

  return (
    <>
      <MobileNavSheet
        title={t("menu")}
        triggerLabel={t("menu")}
        pathname={pathname}
        items={links}
        footer={logoutButton}
      />
      <aside className="hidden rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 lg:block lg:sticky lg:top-28">
        {profileHeader}
        {navLinks}
        {logoutButton}
      </aside>
    </>
  );
}
