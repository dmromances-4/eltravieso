"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/travieso/vermut-chico-botellas-lineart.svg";

type Props = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md";
};

export default function BrandLogo({ className, showWordmark = true, size = "md" }: Props) {
  const t = useTranslations("common");
  const iconSize = size === "sm" ? 32 : 40;

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={t("brand")}
    >
      <Image
        src={LOGO_SRC}
        alt=""
        width={iconSize}
        height={Math.round(iconSize * 1.35)}
        className="shrink-0"
        priority
      />
      {showWordmark ? (
        <span className="hidden font-display text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-electric-blue sm:inline sm:text-xl">
          {t("brand")}
        </span>
      ) : null}
    </Link>
  );
}
