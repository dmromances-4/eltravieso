import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetaChipProps = {
  children: ReactNode;
  tone?: "neutral" | "blue" | "yellow" | "red";
  className?: string;
};

const tones = {
  neutral: "border-white/10 bg-white/5 text-slate-300",
  blue: "border-electric-blue/20 bg-electric-blue/10 text-electric-blue",
  yellow: "border-electric-yellow/20 bg-electric-yellow/10 text-electric-yellow",
  red: "border-electric-red/20 bg-electric-red/10 text-electric-red",
};

export function MetaChip({ children, tone = "neutral", className }: MetaChipProps) {
  return (
    <span className={cn("inline-flex items-center rounded-pill border px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
