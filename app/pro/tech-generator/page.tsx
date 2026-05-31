"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import PDFExport from "@/components/PDFExport";

const tabs = [
  { id: "sheet", label: "Generar Ficha Técnica" },
  { id: "agent", label: "Creador de Recetas" },
] as const;

type TabId = (typeof tabs)[number]["id"];

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
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => (searchParams.get("tab") === "agent" ? "agent" : "sheet"));
  const [baseRecipe, setBaseRecipe] = useState("");
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab") === "agent") {
      setTab("agent");
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

  useEffect(() => {
    if (tab !== "agent") return;

    const query = promptText.trim();
    if (query.length < 3) {
      setSearchMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchMatches(data.matches ?? []);
      } catch {
        setSearchMatches([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [promptText, tab]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    if (!aiStatus?.available) {
      setError("El agente de IA no está disponible. Revisa las API keys en .env.local (ver .env.example).");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const route = tab === "sheet" ? "/api/ai/generate-sheet" : "/api/ai/agent";
    const body = tab === "sheet" ? { baseRecipe } : { prompt: promptText };

    try {
      const res = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al generar el contenido");
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const promptLabel =
    tab === "sheet"
      ? "Ingredientes Base (ej: Vermut rojo, naranja amarga, ginebra)"
      : "Describe tu idea, comentarios o adaptación (ej: daiquiri de melocotón con vermut, menos dulce)";

  const promptPlaceholder =
    tab === "sheet"
      ? "Escribe los ingredientes base aquí..."
      : "Ej: Quiero un cóctel cítrico y refrescante con vermut rojo para terraza, inspirado en un daiquiri...";

  const agentReady = !statusLoading && aiStatus?.available;
  const hasIngredients = Array.isArray(result?.ingredients) && result.ingredients.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Barra Inteligente</h1>
          <p className="mt-4 text-xl text-zinc-400">
            Busca en el recetario, escribe tu briefing y crea recetas nuevas con IA.
          </p>
        </div>

        {!statusLoading && !agentReady ? (
          <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-100">
            <p className="font-semibold">Agente no configurado</p>
            <p className="mt-2 text-sm text-amber-200/90">
              Añade <code className="rounded bg-black/30 px-1.5 py-0.5">GEMINI_API_KEY</code> o{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">GROQ_API_KEY</code> en{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code> y reinicia el servidor.
            </p>
          </div>
        ) : null}

        {agentReady && aiStatus?.text.preferred ? (
          <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-emerald-400/90">
            IA activa · {aiStatus.text.preferred}
          </p>
        ) : null}

        <div className="flex gap-2 mb-8">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 shadow sm:rounded-2xl border border-zinc-800 mb-8">
          <div className="px-4 py-6 sm:p-8">
            <form onSubmit={handleGenerate}>
              <div className="mb-5">
                <label htmlFor="input" className="block text-sm font-medium text-zinc-300">
                  {promptLabel}
                </label>
                <div className="mt-3">
                  <textarea
                    id="input"
                    name="input"
                    rows={5}
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-zinc-700 bg-zinc-950 text-white rounded-2xl p-4"
                    placeholder={promptPlaceholder}
                    value={tab === "sheet" ? baseRecipe : promptText}
                    onChange={(e) => (tab === "sheet" ? setBaseRecipe(e.target.value) : setPromptText(e.target.value))}
                    required
                    disabled={!agentReady}
                  />
                </div>
              </div>

              {tab === "agent" && promptText.trim().length >= 3 ? (
                <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    {searchLoading ? "Buscando en el recetario…" : "Recetas relacionadas en el catálogo"}
                  </p>
                  {searchMatches.length > 0 ? (
                    <ul className="space-y-2">
                      {searchMatches.map((match) => (
                        <li key={match.slug}>
                          <Link
                            href={match.href}
                            className="block rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 hover:border-red-500/40 transition"
                          >
                            <p className="font-medium text-white">{match.title}</p>
                            <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{match.ingredients.join(" · ")}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !searchLoading && (
                      <p className="text-sm text-zinc-500">No hay coincidencias; el agente creará una receta nueva.</p>
                    )
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading || !agentReady}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creando receta…" : tab === "sheet" ? "Generar Ficha Técnica" : "Crear receta"}
                </button>
                <p className="text-sm text-zinc-500">
                  {tab === "sheet"
                    ? "Ficha técnica lista para barra y PDF."
                    : "Se publica en /recetas con ingredientes y método completos."}
                </p>
              </div>
            </form>
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-200 p-4 rounded-xl mb-8">
            <p>{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="bg-zinc-900 shadow overflow-hidden sm:rounded-2xl border border-zinc-800">
            <div className="px-5 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-800">
              <div>
                <h3 className="text-2xl font-bold text-white">{result.title}</h3>
                {result.slug ? <p className="mt-1 text-sm text-zinc-400">Slug: {result.slug}</p> : null}
                {result.message ? <p className="mt-2 text-sm text-emerald-300">{result.message}</p> : null}
                {result.viewUrl ? (
                  <Link href={result.viewUrl} className="mt-3 inline-flex text-sm font-semibold text-red-400 hover:text-red-300">
                    Ver en el recetario →
                  </Link>
                ) : null}
              </div>
              <div>{result.title ? <PDFExport data={result} /> : null}</div>
            </div>
            <div className="border-t border-zinc-800 px-4 py-5 sm:p-6">
              <dl className="space-y-6">
                {result.summary ? (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-zinc-400">Resumen</dt>
                    <dd className="text-white text-base leading-7">{result.summary}</dd>
                  </div>
                ) : null}

                <div className="space-y-2 bg-zinc-950/60 rounded-3xl border border-zinc-800 p-5">
                  <dt className="text-sm font-semibold text-zinc-400">Ingredientes</dt>
                  <dd>
                    {hasIngredients ? (
                      <ul className="space-y-2">
                        {result.ingredients!.map((ing, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"
                          >
                            <span className="text-white">{ing.name}</span>
                            <span className="text-zinc-300 font-semibold">{ing.amount}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-200">No se pudieron extraer ingredientes. Intenta de nuevo con más detalle.</p>
                    )}
                  </dd>
                </div>

                <div className="space-y-2">
                  <dt className="text-sm font-semibold text-zinc-400">Método</dt>
                  <dd className="whitespace-pre-line text-zinc-200 text-sm leading-7 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                    {result.method}
                  </dd>
                </div>

                {result.tasting ? (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-zinc-400">Cata</dt>
                    <dd className="whitespace-pre-line text-zinc-200 text-sm leading-7 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                      {result.tasting}
                    </dd>
                  </div>
                ) : null}

                {result.cost || result.abv ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.cost ? (
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <dt className="text-sm font-semibold text-zinc-400">Coste estimado</dt>
                        <dd className="mt-2 text-lg font-semibold text-emerald-300">{result.cost} €</dd>
                      </div>
                    ) : null}
                    {result.abv ? (
                      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <dt className="text-sm font-semibold text-zinc-400">ABV</dt>
                        <dd className="mt-2 text-lg font-semibold text-red-400">{result.abv}%</dd>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TechGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 py-24 text-center text-zinc-400">Cargando Barra Inteligente…</div>
      }
    >
      <TechGeneratorContent />
    </Suspense>
  );
}
