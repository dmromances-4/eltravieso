import Image from "next/image";
import GeneratedCocktailImage from "@/components/GeneratedCocktailImage";
import { isPhotoCover } from "@/lib/recipes/cover-utils";

type RecipeCoverImageProps = {
  title: string;
  cover?: string | null;
  attribution?: string | null;
};

export default function RecipeCoverImage({ title, cover, attribution }: RecipeCoverImageProps) {
  if (!isPhotoCover(cover)) {
    return <GeneratedCocktailImage title={title} />;
  }

  const isRemote = cover!.startsWith("http") || cover!.startsWith("/uploads/");

  const imageBlock =
    isRemote || cover!.endsWith(".svg") ? (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-neon aspect-[4/5] bg-[#0a0a0a]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover!} alt={title} className="h-full w-full object-cover" />
      </div>
    ) : (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-neon aspect-[4/5]">
        <Image src={cover!} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      </div>
    );

  if (!attribution?.trim()) return imageBlock;

  return (
    <figure className="space-y-2">
      {imageBlock}
      <figcaption className="text-center text-[11px] text-slate-500">{attribution}</figcaption>
    </figure>
  );
}
