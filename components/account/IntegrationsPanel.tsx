"use client";

import { useEffect, useState } from "react";

type ProviderSync = {
  connected: boolean;
  lastSyncAt: string | null;
  syncStatus: string;
  syncError: string | null;
};

type IntegrationsState = {
  shopify: ProviderSync & {
    shopName: string | null;
    hasApiKey: boolean;
    oauthAvailable: boolean;
  };
  holded: ProviderSync & {
    hasApiKey: boolean;
    usesServerKey: boolean;
    webhookUrl: string | null;
    barToken: string | null;
    hasBarToken: boolean;
    webhookConfigured: boolean;
  };
  square: ProviderSync & {
    locationId: string | null;
  };
  tpvWebhookUrl: string | null;
  tpvProvider: string | null;
};

type ProviderId = "shopify" | "holded" | "square";

export default function IntegrationsPanel({ demoMode = false }: { demoMode?: boolean }) {
  const [data, setData] = useState<IntegrationsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ProviderId | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopifyApiKey, setShopifyApiKey] = useState("");
  const [holdedApiKey, setHoldedApiKey] = useState("");
  const [squareAccessToken, setSquareAccessToken] = useState("");
  const [squareLocationId, setSquareLocationId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<ProviderId | null>(null);

  const refresh = () =>
    fetch("/api/user/integrations")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        if (json.shopify?.shopName) setShopName(json.shopify.shopName);
        if (json.square?.locationId) setSquareLocationId(json.square.locationId);
      });

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const regenerateHoldedToken = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateHoldedWebhookToken: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      if (json.holdedWebhookTokenOnce) {
        setMessage(`Nuevo token webhook (cópialo ahora): ${json.holdedWebhookTokenOnce}`);
      } else {
        setMessage(json.message ?? "Token regenerado.");
      }
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al regenerar el token");
    } finally {
      setSaving(false);
    }
  };

  const connectShopifyOAuth = () => {
    if (!shopName.trim()) {
      setMessage("Introduce el nombre de la tienda antes de conectar con OAuth.");
      setActiveModal("shopify");
      return;
    }
    window.location.href = `/api/integrations/shopify/oauth?shop=${encodeURIComponent(shopName.trim())}`;
  };

  const syncProvider = async (provider: ProviderId) => {
    setSyncing(provider);
    setMessage(null);
    try {
      const res = await fetch(`/api/integrations/${provider}/sync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setMessage(json.message);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setSyncing(null);
    }
  };

  const saveIntegration = async () => {
    if (!activeModal) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, string> = {};
      if (activeModal === "shopify") {
        payload.shopifyShopName = shopName;
        if (shopifyApiKey.trim()) payload.shopifyApiKey = shopifyApiKey;
      }
      if (activeModal === "holded" && holdedApiKey.trim()) {
        payload.holdedApiKey = holdedApiKey;
      }
      if (activeModal === "square") {
        if (squareAccessToken.trim()) payload.squareAccessToken = squareAccessToken;
        if (squareLocationId.trim()) payload.squareLocationId = squareLocationId;
      }

      const res = await fetch("/api/user/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(json);
      setMessage("Integración guardada correctamente.");
      setActiveModal(null);
      setShopifyApiKey("");
      setHoldedApiKey("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Cargando integraciones…</p>;
  }

  const providers = [
    {
      id: "square" as const,
      name: "Square",
      description: "Sincroniza catálogo y ventas desde tu TPV Square.",
      color: "border-[#006AFF]/30",
      connected: data?.square.connected,
      sync: data?.square,
    },
    {
      id: "holded" as const,
      name: "Holded",
      description: "Conecta facturación y stock con Holded.",
      color: "border-emerald-500/30",
      connected: data?.holded.connected,
      sync: data?.holded,
    },
    {
      id: "shopify" as const,
      name: "Shopify",
      description: "Importa productos de tu tienda Shopify.",
      color: "border-[#96BF48]/30",
      connected: data?.shopify.connected,
      sync: data?.shopify,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Integraciones</h1>
        <p className="mt-2 text-slate-400">Conecta tu TPV o tienda online para sincronizar catálogos.</p>
      </div>

      {demoMode ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Integraciones desactivadas en esta demo (Shopify, Holded, Square y TPV). La pantalla está disponible para
          consulta, pero conectar cuentas y sincronizar catálogos no está habilitado.
        </div>
      ) : null}

      {data?.tpvWebhookUrl ? (
        <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Webhook TPV (solo lectura)</p>
          <code className="mt-2 block break-all text-sm text-electric-yellow">{data.tpvWebhookUrl}</code>
        </div>
      ) : null}

      {data?.holded.connected && data.holded.webhookUrl ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#121212] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Webhook Holded (bidireccional)</p>
          <p className="mt-2 text-xs text-slate-400">
            Entrada: configura esta URL en Zapier/Make o cuando Holded active webhooks. Cabeceras:{" "}
            <code className="text-slate-300">x-holded-signature</code>,{" "}
            <code className="text-slate-300">x-holded-bar-token</code>.
          </p>
          <code className="mt-2 block break-all text-sm text-emerald-300">{data.holded.webhookUrl}</code>
          {data.holded.barToken ? (
            <p className="mt-3 text-xs text-slate-500">
              Token del bar (enmascarado): <code className="text-slate-300">{data.holded.barToken}</code>
            </p>
          ) : null}
          {data.holded.hasBarToken ? (
            <button
              type="button"
              onClick={regenerateHoldedToken}
              disabled={saving}
              className="mt-3 text-xs font-bold uppercase tracking-widest text-electric-yellow hover:text-white disabled:opacity-50"
            >
              Regenerar token webhook
            </button>
          ) : null}
          {!data.holded.webhookConfigured ? (
            <p className="mt-2 text-xs text-amber-400">
              Define HOLDED_WEBHOOK_SECRET en el servidor (o usa el token del bar como secreto HMAC).
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        {providers.map((p) => (
          <article
            key={p.id}
            className={`flex flex-col rounded-[2rem] border bg-[#121212] p-8 ${p.color} shadow-neon`}
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl font-display font-bold text-white">
              {p.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white">{p.name}</h2>
            <p className="mt-3 flex-grow text-sm text-slate-400">{p.description}</p>
            {p.connected ? (
              <div className="mt-6 space-y-2">
                <span className="inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
                  Conectado
                </span>
                {p.id === "holded" && data?.holded.usesServerKey ? (
                  <p className="text-xs text-slate-500">Usando API key del servidor</p>
                ) : null}
                {p.sync?.lastSyncAt ? (
                  <p className="text-xs text-slate-500">
                    Última sync: {new Date(p.sync.lastSyncAt).toLocaleString("es-ES")}
                  </p>
                ) : null}
                {p.sync?.syncError ? (
                  <p className="text-xs text-red-400">{p.sync.syncError}</p>
                ) : null}
              </div>
            ) : null}
            {p.connected ? (
              <button
                type="button"
                onClick={() => syncProvider(p.id)}
                disabled={syncing === p.id || demoMode}
                className="mt-4 rounded-full border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:border-electric-yellow hover:text-electric-yellow disabled:opacity-50"
              >
                {syncing === p.id ? "Sincronizando…" : "Sincronizar catálogo"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveModal(p.id)}
              disabled={demoMode}
              className="mt-4 rounded-full border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:border-electric-yellow hover:text-electric-yellow disabled:opacity-50"
            >
              {p.connected ? "Reconfigurar" : "Conectar cuenta"}
            </button>
          </article>
        ))}
      </div>

      {activeModal === "shopify" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-8 shadow-neon">
            <h3 className="text-xl font-bold text-white">Conectar Shopify</h3>
            <p className="mt-2 text-sm text-slate-400">
              Conecta vía OAuth (recomendado) o introduce API Key privada para desarrollo.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre de la tienda</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="mi-tienda"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">API Key</label>
                <input
                  type="password"
                  value={shopifyApiKey}
                  onChange={(e) => setShopifyApiKey(e.target.value)}
                  placeholder="shpat_…"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {data?.shopify.oauthAvailable ? (
                <button
                  type="button"
                  onClick={connectShopifyOAuth}
                  disabled={!shopName.trim()}
                  className="w-full rounded-full bg-[#96BF48] py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                >
                  Conectar con OAuth
                </button>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 rounded-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveIntegration}
                  disabled={saving || !shopName.trim()}
                  className="flex-1 rounded-full bg-electric-yellow py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeModal === "holded" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-8 shadow-neon">
            <h3 className="text-xl font-bold text-white">Conectar Holded</h3>
            <p className="mt-2 text-sm text-slate-400">
              Usa la API key de tu cuenta Holded. Si el servidor ya tiene HOLDED_API_KEY, puedes sincronizar sin
              guardar una clave propia.
            </p>
            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">API Key (opcional)</label>
              <input
                type="password"
                value={holdedApiKey}
                onChange={(e) => setHoldedApiKey(e.target.value)}
                placeholder="Clave de Holded"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 rounded-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveIntegration}
                disabled={saving}
                className="flex-1 rounded-full bg-emerald-500 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeModal === "square" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-8 shadow-neon">
            <h3 className="text-xl font-bold text-white">Conectar Square</h3>
            <p className="mt-2 text-sm text-slate-400">
              Introduce el access token de Square y, opcionalmente, el ID de ubicación para ventas TPV.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Access token</label>
                <input
                  type="password"
                  value={squareAccessToken}
                  onChange={(e) => setSquareAccessToken(e.target.value)}
                  placeholder="EAAA…"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Location ID (opcional)</label>
                <input
                  type="text"
                  value={squareLocationId}
                  onChange={(e) => setSquareLocationId(e.target.value)}
                  placeholder="L…"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white focus:border-electric-yellow focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 rounded-full border border-white/20 py-3 text-xs font-bold uppercase tracking-widest text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveIntegration}
                disabled={saving || !squareAccessToken.trim()}
                className="flex-1 rounded-full bg-[#006AFF] py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
