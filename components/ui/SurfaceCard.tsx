import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = {
  href?: string;
  className?: string;
  children: ReactNode;
};

export function SurfaceCard({ href, className, children }: SurfaceCardProps) {
  const classes = cn(
    "rounded-card border border-white/10 bg-[var(--surface-panel)]/90 p-8 transition-all hover:border-electric-yellow/25 hover:bg-charcoal/95",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn("group block", classes)}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
