import Image from "next/image";
import GeneratedCocktailImage from "@/components/GeneratedCocktailImage";

type RecipeCoverImageProps = {
  title: string;
  cover?: string | null;
};

const PLACEHOLDER = "/cocktail-placeholder.svg";

function isRealCover(cover?: string | null) {
  return Boolean(cover && cover !== PLACEHOLDER && !cover.includes("placeholder"));
}

export default function RecipeCoverImage({ title, cover }: RecipeCoverImageProps) {
  if (!isRealCover(cover)) {
    return <GeneratedCocktailImage title={title} />;
  }

  const isRemote = cover!.startsWith("http") || cover!.startsWith("/uploads/");

  if (isRemote || cover!.endsWith(".svg")) {
    return (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-neon aspect-[4/5] bg-[#0a0a0a]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover!} alt={title} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-neon aspect-[4/5]">
      <Image src={cover!} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
    </div>
  );
}
