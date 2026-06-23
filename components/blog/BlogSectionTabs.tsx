"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { BlogSection } from "@/types/editorial-author";

type Props = {
  active: BlogSection;
  basePath?: string;
};

const SECTIONS: BlogSection[] = ["written", "video", "podcast"];

export default function BlogSectionTabs({ active, basePath = "/blog" }: Props) {
  const t = useTranslations("blog.sections");

  return (
    <nav className="flex flex-wrap gap-3" aria-label="Secciones del blog">
      {SECTIONS.map((section) => {
        const isActive = section === active;
        return (
          <Link
            key={section}
            href={`${basePath}?section=${section}`}
            className={`rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
              isActive
                ? "border-electric-blue/40 bg-electric-blue/10 text-electric-blue"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {t(section)}
          </Link>
        );
      })}
    </nav>
  );
}
