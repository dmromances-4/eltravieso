import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function PageHero({ eyebrow, title, lead, actions, compact = false, className }: PageHeroProps) {
  return (
    <div className={cn(compact ? "space-y-4" : "space-y-6", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className={cn(compact ? "text-3xl sm:text-4xl" : "text-display")}>{title}</h1>
      {lead ? <p className={cn("max-w-2xl text-body", compact && "text-sm")}>{lead}</p> : null}
      {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
    </div>
  );
}
