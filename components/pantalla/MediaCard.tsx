import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { MediaKind } from "@prisma/client";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { MetaChip } from "@/components/ui/MetaChip";
import { MEDIA_KIND_LABELS } from "@/lib/media/types";

type MediaCardProps = {
  slug: string;
  title: string;
  kind: MediaKind;
  coverUrl?: string | null;
  summary?: string | null;
  ratingAvg?: number;
  cocktailSlugs?: string[];
};

export default function MediaCard({
  slug,
  title,
  kind,
  coverUrl,
  summary,
  ratingAvg = 0,
  cocktailSlugs = [],
}: MediaCardProps) {
  return (
    <EditorialCard
      href={`/pantalla/${slug}`}
      title={title}
      subtitle={MEDIA_KIND_LABELS[kind]}
      imageSrc={coverUrl}
      imageAlt={title}
      aspect="portrait"
      meta={
        <>
          {ratingAvg > 0 ? <MetaChip tone="yellow">{`★ ${ratingAvg.toFixed(1)}`}</MetaChip> : null}
          {cocktailSlugs.length > 0 ? (
            <MetaChip tone="blue">{`${cocktailSlugs.length} cóctel(es)`}</MetaChip>
          ) : null}
        </>
      }
      footer={
        summary ? (
          <p className="line-clamp-2 text-sm text-slate-400">{summary}</p>
        ) : (
          <Link href={`/pantalla/${slug}`} className="text-sm font-medium text-electric-blue hover:text-white">
            Ver ficha →
          </Link>
        )
      }
    />
  );
}
