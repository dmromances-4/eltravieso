"use client";

import { Link } from "@/i18n/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import RecipeSearchBar from "@/components/recipes/RecipeSearchBar";
import { PageHero } from "@/components/ui/PageHero";

type AiStatusResponse = {
  available: boolean;
  text: { providers: string[]; preferred: string | null };
};

type SearchMatch = {
  title: string;
  slug: string;
  ingredients: string[];
  href: string;
};

type AgentResult = {
  title?: string;
  summary?: string;
  glass?: string;
  ingredients?: Array<{ name: string; amount: string }>;
  method?: string;
  abv?: number | null;
  cost?: number | null;
  slug?: string;
  tasting?: string;
  viewUrl?: string;
  message?: string;
  matches?: SearchMatch[];
};

function TechGeneratorContent() {
  const t = useTranslations("techGenerator");
  const searchParams = useSearchParams();
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("prompt")) {
      setPromptText(searchParams.get("prompt") ?? "");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/ai/status");
        const data = (await res.json()) as AiStatusResponse;
        if (!cancelled) setAiStatus(data);
      } catch {
        if (!cancelled) setAiStatus({ available: false, text: { providers: [], preferred: null } });
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    if (!aiStatus?.available) {
      setError(t("agentUnavailable"));
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t("generateError"));
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  const agentReady = !statusLoading && aiStatus?.available;
  const hasIngredients = Array.isArray(result?.ingredients) && result.ingredients.length > 0;

  return (
    <main className="min-h-screen bg-[#FAFAFA] pt-28 pb-16 text-slate-900">
      <div className="section-shell max-w-4xl space-y-8">
        <PageHero title={t("title")} lead={t("subtitle")} />

        {!statusLoading && !agentReady ? (
          <div className="rounded-card border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <p className="font-semibold">{t("notConfiguredTitle")}</p>
            <p className="mt-2 text-sm text-amber-800">{t("notConfiguredBody")}</p>
          </div>
        ) : null}

        {agentReady && aiStatus?.text.preferred ? (
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {t("aiActive", { provider: aiStatus.text.preferred })}
          </p>
        ) : null}

        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label htmlFor="input" className="block text-sm font-medium text-slate-700">
                {t("promptLabel")}
              </label>
              <textarea
                id="input"
                name="input"
                rows={5}
                className="mt-3 block w-full rounded-card border border-slate-200 bg-white p-4 text-slate-900 shadow-sm focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue sm:text-sm"
                placeholder={t("promptPlaceholder")}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                required
                disabled={!agentReady || loading}
              />
            </div>

            <div className="rounded-card border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("catalogSearch")}
              </p>
              <RecipeSearchBar
                variant="full"
                defaultQuery={promptText}
                onQueryChange={setPromptText}
                showTypeahead
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading || !agentReady}
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-electric-red px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-electric-red focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t("creating")}
                  </>
                ) : (
                  t("createRecipe")
                )}
              </button>
              <p className="text-sm text-slate-500">{t("publishHint")}</p>
            </div>
          </form>
        </div>

        {error ? (
          <div className="rounded-card border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <h3 className="text-2xl font-bold text-slate-900">{result.title}</h3>
              {result.slug ? <p className="mt-1 text-sm text-slate-500">Slug: {result.slug}</p> : null}
              {result.message ? <p className="mt-2 text-sm text-emerald-700">{result.message}</p> : null}
              {result.viewUrl ? (
                <Link href={result.viewUrl} className="mt-3 inline-flex text-sm font-semibold text-electric-red hover:underline">
                  {t("viewInCatalog")} →
                </Link>
              ) : null}
            </div>
            <div className="border-t border-slate-200 px-4 py-5 sm:p-6">
              <dl className="space-y-6">
                {result.glass ? (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-slate-500">{t("glass")}</dt>
                    <dd className="text-base text-slate-900">{result.glass}</dd>
                  </div>
                ) : null}

                {result.summary ? (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-slate-500">{t("summary")}</dt>
                    <dd className="text-base leading-7 text-slate-700">{result.summary}</dd>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-card border border-slate-200 bg-slate-50 p-5">
                  <dt className="text-sm font-semibold text-slate-500">{t("ingredients")}</dt>
                  <dd>
                    {hasIngredients ? (
                      <ul className="space-y-2">
                        {result.ingredients!.map((ing, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-4 rounded-card border border-slate-200 bg-white p-4"
                          >
                            <span className="text-slate-900">{ing.name}</span>
                            <span className="font-semibold text-slate-700">{ing.amount}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-800">{t("noIngredients")}</p>
                    )}
                  </dd>
                </div>

                <div className="space-y-2">
                  <dt className="text-sm font-semibold text-slate-500">{t("method")}</dt>
                  <dd className="whitespace-pre-line rounded-card border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                    {result.method}
                  </dd>
                </div>

                {result.tasting ? (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-slate-500">{t("tasting")}</dt>
                    <dd className="whitespace-pre-line rounded-card border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                      {result.tasting}
                    </dd>
                  </div>
                ) : null}

                {result.cost || result.abv ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.cost ? (
                      <div className="rounded-card border border-slate-200 bg-white p-5">
                        <dt className="text-sm font-semibold text-slate-500">{t("estimatedCost")}</dt>
                        <dd className="mt-2 text-lg font-semibold text-emerald-700">{result.cost} €</dd>
                      </div>
                    ) : null}
                    {result.abv ? (
                      <div className="rounded-card border border-slate-200 bg-white p-5">
                        <dt className="text-sm font-semibold text-slate-500">ABV</dt>
                        <dd className="mt-2 text-lg font-semibold text-electric-red">{result.abv}%</dd>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function TechGeneratorPage() {
  const t = useTranslations("techGenerator");

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] py-24 text-center text-slate-500">{t("loading")}</div>}>
      <TechGeneratorContent />
    </Suspense>
  );
}
