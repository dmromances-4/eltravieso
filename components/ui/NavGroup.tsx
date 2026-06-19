"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NavLinkItem } from "@/lib/navigation/groups";
import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 120;

type NavGroupProps = {
  label: string;
  links: NavLinkItem[];
  className?: string;
};

export function NavGroup({ label, links, className }: NavGroupProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = links.some(
    (l) => pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)),
  );

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={cn(
          "flex min-h-11 items-center gap-1 text-sm font-medium transition-colors",
          isActive ? "text-electric-yellow" : "text-slate-200 hover:text-white",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("transition-transform", open && "rotate-180")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div
            role="menu"
            className="min-w-[13rem] rounded-card border border-white/10 bg-[#121212] py-2 shadow-subtle"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className={cn(
                  "flex min-h-[44px] flex-col justify-center px-4 py-3 transition-colors",
                  pathname === link.href
                    ? "bg-electric-yellow/10 text-electric-yellow"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="text-sm font-medium">{link.name}</span>
                {link.description ? (
                  <span className="text-xs text-slate-500">{link.description}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
