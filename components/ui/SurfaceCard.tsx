import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = {
  href?: string;
  className?: string;
  children: ReactNode;
};

export function SurfaceCard({ href, className, children }: SurfaceCardProps) {
  const classes = cn(
    "rounded-card border border-slate-200 bg-white p-8 transition-all hover:border-electric-yellow/40 hover:shadow-subtle",
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
