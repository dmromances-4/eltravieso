import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  alt?: boolean;
  compact?: boolean;
};

export function Section({ id, children, className, alt = false, compact = false }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        compact ? "py-16 sm:py-20" : "py-20 sm:py-28",
        alt ? "border-t border-white/5 bg-[#0c0c0c]" : "",
        className,
      )}
    >
      <div className="section-shell">{children}</div>
    </section>
  );
}
