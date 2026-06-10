import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BrandLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function BrandLink({ href, className, children }: BrandLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-semibold text-electric-blue transition-colors hover:text-electric-yellow",
        className,
      )}
    >
      {children}
    </Link>
  );
}
