"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

type Props = {
  title: string;
  items: NavItem[];
  pathname: string;
  footer?: ReactNode;
  triggerLabel: string;
};

export default function MobileNavSheet({
  title,
  items,
  pathname,
  footer,
  triggerLabel,
}: Props) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex min-h-[44px] w-full items-center justify-between rounded-card border border-white/10 bg-[var(--surface-panel)] px-4 py-3 text-sm font-medium text-white"
        aria-expanded={open}
      >
        <span>{triggerLabel}</span>
        <span className="text-slate-400">{title}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r border-white/10 bg-[#121212] pb-[env(safe-area-inset-bottom)] pt-[calc(5rem+env(safe-area-inset-top))] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-pill px-3 text-sm text-slate-300"
              >
                {t("close")}
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block min-h-[44px] rounded-card px-4 py-3 text-sm font-medium transition",
                    isActive(item)
                      ? "bg-electric-yellow/10 text-electric-yellow"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            {footer ? <div className="border-t border-white/10 p-4">{footer}</div> : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
