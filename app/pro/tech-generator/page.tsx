"use client";

import { useState } from "react";
import PDFExport from "@/components/PDFExport";

const tabs = [
  { id: "sheet", label: "Generar Ficha Técnica" },
  { id: "agent", label: "Agente de Recetas" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function TechGeneratorPage() {
  const [tab, setTab] = useState<TabId>("sheet");
  const [baseRecipe, setBaseRecipe] = useState("");
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const promptLabel =
    tab === "sheet"
      ? "Ingredientes Base (ej: Vermut rojo, naranja amarga, ginebra)"
      : "Describe la receta o el concepto (ej: cóctel cítrico con toque de vermut para afterwork)";

  const promptPlaceholder =
    tab === "sheet"
      ? "Escribe los ingredientes base aquí..."
      : "Escribe el briefing de la receta aquí...";

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Barra Inteligente</h1>
          <p className="mt-4 text-xl text-zinc-400">
            Un asistente IA para generar fichas técnicas y recetas únicas de vermut premium.
          </p>
        </div>

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
                    rows={4}
                    className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-zinc-700 bg-zinc-950 text-white rounded-2xl p-4"
                    placeholder={promptPlaceholder}
                    value={tab === "sheet" ? baseRecipe : promptText}
                    onChange={(e) => (tab === "sheet" ? setBaseRecipe(e.target.value) : setPromptText(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Consultando IA..." : tab === "sheet" ? "Generar Ficha Técnica" : "Generar Receta"}
                </button>
                <p className="text-sm text-zinc-500">
                  {tab === "sheet" ? "Ficha técnica lista para barra y PDF." : "Receta narrativa que se puede guardar en el catálogo."}
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
                <h3 className="text-2xl font-bold text-white">{result.title || result.name}</h3>
                {result.slug ? <p className="mt-1 text-sm text-zinc-400">Slug: {result.slug}</p> : null}
                {result.message ? <p className="mt-2 text-sm text-emerald-300">{result.message}</p> : null}
              </div>
              <div>{result.title ? <PDFExport data={result} /> : null}</div>
            </div>
            <div className="border-t border-zinc-800 px-4 py-5 sm:p-6">
              <dl className="space-y-6">
                {result.imageUrl ? (
                  <div className="rounded-3xl overflow-hidden border border-zinc-800 bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.imageUrl} alt={result.title} className="w-full object-cover" />
                  </div>
                ) : null}

                {result.summary ? (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-zinc-400">Resumen</dt>
                    <dd className="text-white text-base leading-7">{result.summary}</dd>
                  </div>
                ) : null}

                <div className="space-y-2 bg-zinc-950/60 rounded-3xl border border-zinc-800 p-5">
                  <dt className="text-sm font-semibold text-zinc-400">Ingredientes</dt>
                  <dd>
                    <ul className="space-y-2">
                      {result.ingredients?.map((ing: any, i: number) => (
                        <li key={i} className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                          <span className="text-white">{ing.name}</span>
                          <span className="text-zinc-300 font-semibold">{ing.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>

                <div className="space-y-2">
                  <dt className="text-sm font-semibold text-zinc-400">Método</dt>
                  <dd className="whitespace-pre-line text-zinc-200 text-sm leading-7 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                    {result.method}
                  </dd>
                </div>

                {(result.organolepticDesc || result.tasting) && (
                  <div className="space-y-2">
                    <dt className="text-sm font-semibold text-zinc-400">Notas Organolépticas</dt>
                    <dd className="whitespace-pre-line text-zinc-200 text-sm leading-7 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
                      {result.organolepticDesc || result.tasting}
                    </dd>
                  </div>
                )}

                {(result.cost || result.abv) ? (
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
