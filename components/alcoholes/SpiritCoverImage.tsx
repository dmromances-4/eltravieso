import Image from "next/image";

type Props = {
  title: string;
  imageUrl?: string | null;
  category?: string;
};

export default function SpiritCoverImage({ title, imageUrl, category }: Props) {
  const src = imageUrl?.trim() || "/cocktail-placeholder.svg";

  return (
    <div className="overflow-hidden rounded-card border border-white/10 bg-[var(--surface-panel)] shadow-neon">
      <div className="relative aspect-[4/5] w-full bg-charcoal">
        <Image
          src={src}
          alt={title}
          fill
          className="object-contain p-6"
          sizes="(max-width: 1024px) 100vw, 320px"
          unoptimized={src.startsWith("http")}
        />
      </div>
      {category ? (
        <p className="border-t border-white/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-500">
          {category}
        </p>
      ) : null}
    </div>
  );
}
