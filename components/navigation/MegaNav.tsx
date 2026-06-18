"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NavIcon } from "@/components/navigation/NavIcon";
import {
  NAV_GROUP_KEYS,
  NAV_QUICK_LINKS,
  type NavGroupKey,
  type NavLinkConfig,
} from "@/lib/navigation/groups";
import { cn } from "@/lib/utils";

const GROUP_ORDER: NavGroupKey[] = ["discover", "pro", "community"];

type Props = {
  className?: string;
};

function isLinkActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function MegaLink({ link, label, description }: { link: NavLinkConfig; label: string; description: string }) {
  return (
    <Link
      href={link.href}
      className="flex gap-3 rounded-card p-3 transition-colors hover:bg-slate-50"
    >
      <span className="mt-0.5 text-electric-blue">
        <NavIcon name={link.icon} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </Link>
  );
}

export default function MegaNav({ className }: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<NavGroupKey | null>(null);

  return (
    <nav className={cn("hidden items-center gap-1 lg:flex", className)} aria-label="Main">
      {GROUP_ORDER.map((groupKey) => {
        const group = NAV_GROUP_KEYS[groupKey];
        const isActive = group.links.some((l) => isLinkActive(pathname, l.href));
        const isOpen = openGroup === groupKey;

        return (
          <div
            key={groupKey}
            className="relative"
            onMouseEnter={() => setOpenGroup(groupKey)}
            onMouseLeave={() => setOpenGroup(null)}
          >
            <button
              type="button"
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive || isOpen
                  ? "border-electric-yellow text-slate-900"
                  : "border-transparent text-slate-600 hover:text-slate-900",
              )}
              aria-expanded={isOpen}
            >
              {t(group.labelKey)}
            </button>

            {isOpen ? (
              <div className="absolute left-0 top-full z-50 w-[min(100vw-2rem,22rem)] pt-2">
                <div className="rounded-card border border-slate-200 bg-white p-3 shadow-subtle">
                  {groupKey === "discover" ? (
                    <div className="mb-3 border-b border-slate-100 pb-3">
                      <p className="mb-2 px-3 text-xs font-semibold text-slate-500">{t("nav.quickAccess")}</p>
                      <div className="flex flex-wrap gap-2 px-1">
                        {NAV_QUICK_LINKS.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-pill bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-electric-yellow/30 hover:text-slate-900"
                          >
                            {t(link.nameKey)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-1">
                    {group.links.map((link) => (
                      <MegaLink
                        key={link.href}
                        link={link}
                        label={t(link.nameKey)}
                        description={t(link.descriptionKey)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((groupKey) => {
        const group = NAV_GROUP_KEYS[groupKey];
        return (
          <div key={groupKey}>
            <p className="mb-3 text-sm font-semibold text-slate-500">{t(group.labelKey)}</p>
            <div className="space-y-1">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors",
                    isLinkActive(pathname, link.href)
                      ? "bg-electric-yellow/20 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span className="text-electric-blue">
                    <NavIcon name={link.icon} className="h-4 w-4" />
                  </span>
                  <span>{t(link.nameKey)}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
