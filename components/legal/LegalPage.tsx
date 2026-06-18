import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { loadLegalDocument } from "@/lib/i18n/legal";

type Props = {
  page: "aviso-legal" | "politica-privacidad" | "terminos-y-condiciones";
  locale: AppLocale;
  namespace: "legalNotice" | "privacy" | "terms";
};

export default async function LegalPage({ page, locale, namespace }: Props) {
  const t = await getTranslations({ locale, namespace: `legal.${namespace}` });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const doc = loadLegalDocument(page, locale) ?? loadLegalDocument(page, "es");

  if (!doc) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 text-slate-900">
        <div className="section-shell">
          <h1 className="text-title">{t("title")}</h1>
          <p className="mt-4 text-slate-400">{t("metaDescription")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 text-white">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        <Link
          href="/"
          className="group mb-12 inline-flex min-h-[44px] items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-electric-yellow"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> {tCommon("back")}
        </Link>

        <div className="space-y-12">
          <header className="space-y-6 border-b border-white/10 pb-12">
            <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {doc.updated}
            </p>
          </header>

          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-electric-yellow">
            {doc.sections.map((section) => (
              <section key={section.title} className="mb-10">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
