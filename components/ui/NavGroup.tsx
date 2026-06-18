"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavLinkItem } from "@/lib/navigation/groups";
import { cn } from "@/lib/utils";

type NavGroupProps = {
  label: string;
  links: NavLinkItem[];
  className?: string;
};

export function NavGroup({ label, links, className }: NavGroupProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = links.some(
    (l) => pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)),
  );

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          isActive ? "text-electric-yellow" : "text-slate-200 hover:text-white",
        )}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("transition-transform", open && "rotate-180")}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[11rem] rounded-card border border-white/10 bg-[#121212] py-2 shadow-subtle">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block px-4 py-2.5 text-sm transition-colors",
                pathname === link.href
                  ? "bg-electric-yellow/10 text-electric-yellow"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
