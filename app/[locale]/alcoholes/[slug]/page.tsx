import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getAlcoholBySlug, getAllAlcohols } from "@/lib/alcohol/catalog";
import { formatAbv, isPlaceholderValue } from "@/lib/alcohol/format-abv";
import SpiritCoverImage from "@/components/alcoholes/SpiritCoverImage";
import { MetaChip } from "@/components/ui/MetaChip";
import type { AppLocale } from "@/i18n/routing";

export const revalidate = 86400;

type Props = {
  params: { slug: string; locale: AppLocale };
};

export async function generateStaticParams() {
  return getAllAlcohols("es").map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spirit = getAlcoholBySlug(params.slug, params.locale);
  if (!spirit) return { title: "Destilado no encontrado" };
  return {
    title: `${spirit.identity.name_exact} | Enciclopedia del Alcohol`,
    description: spirit.advanced.history_context_short || spirit.didactic.history_context,
    alternates: {
      languages: { es: `/alcoholes/${params.slug}`, en: `/en/alcoholes/${params.slug}` },
    },
  };
}

export default function AlcoholDetailPage({ params }: Props) {
  const spirit = getAlcoholBySlug(params.slug, params.locale);
  if (!spirit) notFound();

  const code = spirit.productCode ?? spirit.id;
  const abvLabel = formatAbv(spirit.technical.abv);
  const showSensory =
    !isPlaceholderValue(spirit.sensory.sight) ||
    !isPlaceholderValue(spirit.sensory.nose) ||
    !isPlaceholderValue(spirit.sensory.palate);

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-28 pb-24 text-slate-900">
      <div className="section-shell">
        <nav className="mb-10 flex items-center gap-2 text-sm">
          <Link href="/alcoholes" className="text-slate-400 transition-colors hover:text-electric-blue">
            Enciclopedia
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-white">{spirit.identity.name_exact}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
          <div className="space-y-10">
            <div className="space-y-5">
              <p className="eyebrow">{spirit.category}</p>
              <h1 className="text-display">{spirit.identity.name_exact}</h1>
              <p className="text-lg text-electric-blue">
                {spirit.identity.brand}
                {abvLabel ? ` · ${abvLabel}` : null}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">{code}</p>
              <div className="flex flex-wrap gap-2">
                <MetaChip tone="blue">{spirit.subcategory}</MetaChip>
                <MetaChip tone="yellow">{spirit.identity.country}</MetaChip>
              </div>
            </div>

            <div className="max-w-xl lg:hidden">
              <SpiritCoverImage
                title={spirit.identity.name_exact}
                imageUrl={spirit.imageUrl}
                category={spirit.subcategory}
              />
            </div>

            <section className="space-y-4 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 sm:p-8">
              <h2 className="text-title">Origen</h2>
              <p className="text-body text-slate-300">
                {spirit.identity.producer} — {spirit.identity.region}
                {spirit.identity.sub_region ? `, ${spirit.identity.sub_region}` : ""}
              </p>
              <p className="text-sm text-slate-400">{spirit.denomination_of_origin}</p>
            </section>

            {showSensory ? (
            <section className="space-y-4 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 sm:p-8">
              <h2 className="text-title">Notas de cata</h2>
              <ul className="space-y-2 text-body text-slate-300">
                {!isPlaceholderValue(spirit.sensory.sight) ? (
                  <li>
                    <span className="text-slate-500">Vista: </span>
                    {spirit.sensory.sight}
                  </li>
                ) : null}
                {!isPlaceholderValue(spirit.sensory.nose) ? (
                  <li>
                    <span className="text-slate-500">Nariz: </span>
                    {spirit.sensory.nose}
                  </li>
                ) : null}
                {!isPlaceholderValue(spirit.sensory.palate) ? (
                  <li>
                    <span className="text-slate-500">Boca: </span>
                    {spirit.sensory.palate}
                  </li>
                ) : null}
              </ul>
            </section>
            ) : null}

            <section className="space-y-4 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 sm:p-8">
              <h2 className="text-title">Mixología</h2>
              <p className="text-body text-slate-300">{spirit.didactic.mixology_role}</p>
              {spirit.didactic.iconic_cocktails.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {spirit.didactic.iconic_cocktails.map((name) => (
                    <li key={name}>
                      <MetaChip tone="blue">{name}</MetaChip>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="space-y-3 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 sm:p-8">
              <h2 className="text-title">Contexto</h2>
              <p className="text-body text-slate-300">{spirit.didactic.history_context}</p>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="hidden lg:block">
              <SpiritCoverImage
                title={spirit.identity.name_exact}
                imageUrl={spirit.imageUrl}
                category={spirit.subcategory}
              />
            </div>
            <dl className="space-y-3 rounded-card border border-white/10 bg-[var(--surface-panel)] p-6 text-sm text-slate-300">
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-500">Crianza</dt>
                <dd>{spirit.chronology.maturation_time}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-500">Barrica</dt>
                <dd>{spirit.chronology.barrel_type}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-slate-500">Formatos</dt>
                <dd>{spirit.market.bottle_formats.join(", ") || "—"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
