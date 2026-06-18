import { Link } from "@/i18n/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
} as const;

const variants = {
  primary:
    "rounded-pill bg-electric-yellow font-semibold text-black transition-colors hover:brightness-105 disabled:opacity-50",
  secondary:
    "rounded-pill border border-white/15 bg-transparent font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5 disabled:opacity-50",
  danger:
    "rounded-pill bg-electric-red font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50",
  ghost:
    "rounded-pill font-medium text-slate-300 transition-colors hover:text-white disabled:opacity-50",
} as const;

type BrandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
};

export function BrandButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: BrandButtonProps) {
  return (
    <button type="button" className={cn(variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

type BrandLinkButtonProps = {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

export function BrandLinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: BrandLinkButtonProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center", variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
