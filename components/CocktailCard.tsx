"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { MetaChip } from "@/components/ui/MetaChip";

interface CocktailCardProps {
  title: string;
  slug: string;
  rating: number;
  glass: string;
  ingredients: string[];
  abv: string;
  kcal: number;
  cover: string;
}

export default function CocktailCard({
  title,
  slug,
  rating,
  glass,
  ingredients,
  abv,
  kcal,
  cover,
}: CocktailCardProps) {
  const t = useTranslations("recipeDetail");
  const preview = ingredients
    .slice(0, 3)
    .map((item) => item.replace(/\n|\r/g, " ").trim())
    .join(" · ");

  return (
    <EditorialCard
      href={`/recetas/${slug}`}
      title={title}
      subtitle={glass}
      imageSrc={cover}
      imageAlt={title}
      meta={
        <>
          {abv !== "—" ? <MetaChip>{`${abv} ABV`}</MetaChip> : null}
          <MetaChip>{`${kcal} kcal`}</MetaChip>
          <MetaChip tone="yellow">{`★ ${rating.toFixed(1)}`}</MetaChip>
        </>
      }
      footer={
        <div className="space-y-3">
          <p className="line-clamp-2 text-sm leading-6 text-slate-400">
            {preview}
            {ingredients.length > 3 ? " · …" : ""}
          </p>
          <Link
            href={`/recetas/${slug}`}
            className="text-sm font-medium text-electric-blue transition-colors hover:text-white"
          >
            {t("viewRecipe")} →
          </Link>
        </div>
      }
    />
  );
}
