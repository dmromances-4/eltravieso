import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EditorialCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  imageSrc?: string | null;
  imageAlt?: string;
  aspect?: "portrait" | "square" | "video";
  badge?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const aspects = {
  portrait: "aspect-[4/5]",
  square: "aspect-square",
  video: "aspect-video",
};

export function EditorialCard({
  href,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  aspect = "portrait",
  badge,
  meta,
  footer,
  className,
}: EditorialCardProps) {
  return (
    <article className={cn("group flex flex-col overflow-hidden rounded-card border border-white/10 bg-[var(--surface-panel)] transition-colors hover:border-white/20", className)}>
      <Link href={href} className="block">
        <div className={cn("relative overflow-hidden bg-charcoal", aspects[aspect])}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt ?? title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-white/20">◆</div>
          )}
          {badge ? <div className="absolute left-3 top-3">{badge}</div> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {subtitle ? <p className="text-xs font-medium text-electric-blue">{subtitle}</p> : null}
        <Link href={href}>
          <h3 className="font-display text-xl font-semibold leading-snug text-white transition-colors group-hover:text-electric-yellow">
            {title}
          </h3>
        </Link>
        {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
        {footer ? <div className="mt-auto border-t border-white/5 pt-4">{footer}</div> : null}
      </div>
    </article>
  );
}
