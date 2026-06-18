"use client";

import { useEffect, useState, type FormEvent } from "react";
import MapPlanPanel from "@/components/account/MapPlanPanel";
import VenueDetailFieldsSection, {
  EMPTY_VENUE_DETAIL_FORM,
  type VenueDetailFormState,
} from "@/components/account/VenueDetailFieldsSection";

type BarProfileData = {
  businessName: string;
  taxId: string;
  licenseNumber: string;
  venueCode: string;
  googleBusinessId: string;
  tripadvisorPlaceId: string;
  coverManagerUrl: string;
  theForkUrl: string;
  tpvProvider: string;
  tpvToken: string;
  venueType: string;
  photoUrl: string;
  isPublicOnMap: boolean;
  slug: string;
  history: string;
  foundationYear: string;
  signatureDrink: string;
  dressCode: string;
  verdict: string;
  vibeTags: string;
  reservationProvider: string;
  reservationUrl: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  autoReorderEnabled: boolean;
  autoReorderThreshold: number;
};

export default function BarSettingsForm() {
  const [formData, setFormData] = useState<BarProfileData>({
    businessName: "",
    taxId: "",
    licenseNumber: "",
    venueCode: "",
    googleBusinessId: "",
    tripadvisorPlaceId: "",
    coverManagerUrl: "",
    theForkUrl: "",
    tpvProvider: "",
    tpvToken: "",
    venueType: "",
    photoUrl: "",
    isPublicOnMap: false,
    slug: "",
    history: "",
    foundationYear: "",
    signatureDrink: "",
    dressCode: "",
    verdict: "",
    vibeTags: "",
    reservationProvider: "",
    reservationUrl: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    country: "España",
    phone: "",
    email: "",
    autoReorderEnabled: false,
    autoReorderThreshold: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [worlds50Rank, setWorlds50Rank] = useState<number | null>(null);
  const [hasTpvToken, setHasTpvToken] = useState(false);
  const [mapPlan, setMapPlan] = useState<"FREE" | "FEATURED" | "BOOKING_PLUS">("FREE");
  const [mapPlanExpiresAt, setMapPlanExpiresAt] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
  const [venueDetail, setVenueDetail] = useState<VenueDetailFormState>(EMPTY_VENUE_DETAIL_FORM);

  useEffect(() => {
    async function loadBarProfile() {
      try {
        const res = await fetch("/api/user/bar");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setFormData({
              businessName: data.profile.businessName ?? "",
              taxId: data.profile.taxId ?? "",
              licenseNumber: data.profile.licenseNumber ?? "",
              venueCode: data.profile.venueCode ?? "",
              googleBusinessId: data.profile.googleBusinessId ?? "",
              tripadvisorPlaceId: data.profile.tripadvisorPlaceId ?? "",
              coverManagerUrl: data.profile.coverManagerUrl ?? "",
              theForkUrl: data.profile.theForkUrl ?? "",
              tpvProvider: data.profile.tpvProvider ?? "",
              tpvToken: "",
              venueType: data.profile.venueType ?? "",
              photoUrl: data.profile.photoUrl ?? "",
              isPublicOnMap: data.profile.isPublicOnMap ?? false,
              slug: data.profile.slug ?? "",
              history: data.profile.history ?? "",
              foundationYear: data.profile.foundationYear?.toString() ?? "",
              signatureDrink: data.profile.signatureDrink ?? "",
              dressCode: data.profile.dressCode ?? "",
              verdict: data.profile.verdict ?? "",
              vibeTags: Array.isArray(data.profile.vibeTags) ? data.profile.vibeTags.join(", ") : "",
              reservationProvider: data.profile.reservationProvider ?? "",
              reservationUrl: data.profile.reservationUrl ?? "",
              address: data.profile.address ?? "",
              city: data.profile.city ?? "",
              postalCode: data.profile.postalCode ?? "",
              province: data.profile.province ?? "",
              country: data.profile.country ?? "España",
              phone: data.profile.phone ?? "",
              email: data.profile.email ?? "",
              autoReorderEnabled: data.profile.autoReorderEnabled ?? false,
              autoReorderThreshold: data.profile.autoReorderThreshold ?? 0,
            });
            setHasTpvToken(Boolean(data.profile.hasTpvToken));
            setWorlds50Rank(data.profile.guideEntry?.worlds50bestRank ?? null);
            setMapPlan(data.profile.mapPlan ?? "FREE");
            setMapPlanExpiresAt(data.profile.mapPlanExpiresAt ?? null);
            setIsPremium(Boolean(data.profile.isPremium));
            setStripeSubscriptionId(data.profile.stripeSubscriptionId ?? null);
            setVenueDetail({
              establishmentTypes: data.profile.establishmentTypes ?? [],
              cuisineTypes: data.profile.cuisineTypes ?? [],
              starDishes: data.profile.starDishes ?? [],
              idealFor: data.profile.idealFor ?? [],
              venueFeatures: data.profile.venueFeatures ?? [],
              neighborhood: data.profile.neighborhood ?? "",
              priceRange: data.profile.priceRange ?? "",
              dailyMenuEnabled: Boolean(data.profile.dailyMenuEnabled),
              dailyMenuNote: data.profile.dailyMenuNote ?? "",
              awards: data.profile.awards ?? [],
              venuePreferences: data.profile.venuePreferences ?? [],
              instagramUrl: data.profile.instagramUrl ?? "",
              tiktokUrl: data.profile.tiktokUrl ?? "",
              tripadvisorUrl: data.profile.tripadvisorUrl ?? "",
            });
          }
        }
      } catch (err) {
        console.error("Error loading bar profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBarProfile();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = { ...formData, ...venueDetail };
      if (!payload.tpvToken.trim()) {
        delete (payload as { tpvToken?: string }).tpvToken;
      }

      const res = await fetch("/api/user/bar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setHasTpvToken(Boolean(data.profile?.hasTpvToken));
        setFormData((prev) => ({
          ...prev,
          tpvToken: "",
          slug: data.profile?.slug ?? prev.slug,
        }));
        setWorlds50Rank(data.profile?.guideEntry?.worlds50bestRank ?? null);
        setMessage({ type: "success", text: "Datos del local actualizados con éxito." });
      } else {
        setMessage({ type: "error", text: data.message || "Error al actualizar." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de red al actualizar los datos." });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "autoReorderThreshold" ? Number(value) : value,
      }));
    }
  };

  if (loading) {
    return (
      <div className="font-mono text-electric-yellow animate-pulse py-8 text-center uppercase tracking-widest">
        Cargando expediente local...
      </div>
    );
  }

  return (
    <div className="font-mono text-white">
      <MapPlanPanel
        mapPlan={mapPlan}
        mapPlanExpiresAt={mapPlanExpiresAt}
        isPremium={isPremium}
        stripeSubscriptionId={stripeSubscriptionId}
      />
      <form onSubmit={handleSubmit} className="space-y-8">
        {message && (
          <div
            className={`border-4 border-black p-4 font-bold shadow-[4px_4px_0px_#000000] ${
              message.type === "success"
                ? "bg-electric-yellow text-black"
                : "bg-electric-red text-white"
            }`}
          >
            {message.type === "success" ? "⚡ ÉXITO: " : "❌ ERROR: "}
            {message.text}
          </div>
        )}

        {/* Sección: Datos de Facturación / Legales */}
        <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-yellow">
            🧾 Identificación Fiscal & HORECA
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Razón Social *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                NIF / CIF *
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                required
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Licencia de Actividad
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Código El Travieso
              </label>
              <input
                type="text"
                name="venueCode"
                value={formData.venueCode}
                readOnly
                className="w-full border-4 border-black bg-zinc-800 px-4 py-3 font-mono text-slate-300 shadow-[4px_4px_0px_#000000]"
                placeholder="Se asigna al guardar"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Google Business ID
              </label>
              <input
                type="text"
                name="googleBusinessId"
                value={formData.googleBusinessId}
                onChange={handleInputChange}
                placeholder="ChIJ… o ID numérico de ficha"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                TripAdvisor ID
              </label>
              <input
                type="text"
                name="tripadvisorPlaceId"
                value={formData.tripadvisorPlaceId}
                onChange={handleInputChange}
                placeholder="d12345678 o URL de la ficha"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
          </div>
        </div>

        {/* Sección: Dirección y Contacto */}
        <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-blue">
            📍 Localización y Contacto
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ciudad *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Código Postal *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                required
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Provincia
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                País *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Teléfono de contacto
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Email de contacto
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
          </div>
        </div>

        {/* Sección: Mapa público */}
        <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-yellow">
            🗺️ Directorio en mapa
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Tipo de local
              </label>
              <select
                name="venueType"
                value={formData.venueType}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              >
                <option value="">Seleccionar…</option>
                <option value="cocteleria">Coctelería</option>
                <option value="restaurante">Restaurante</option>
                <option value="bar">Bar</option>
                <option value="bodega">Bodega</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                URL foto del local
              </label>
              <input
                type="url"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleInputChange}
                placeholder="https://…"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="isPublicOnMap"
                  name="isPublicOnMap"
                  checked={formData.isPublicOnMap}
                  onChange={handleInputChange}
                  className="h-6 w-6 cursor-pointer border-4 border-black bg-black text-electric-yellow shadow-[2px_2px_0px_#000000] focus:ring-0"
                />
                <label
                  htmlFor="isPublicOnMap"
                  className="cursor-pointer select-none text-sm font-bold uppercase tracking-wider text-white"
                >
                  Visible en el mapa público (/mapa)
                </label>
              </div>
            </div>
          </div>
          {formData.isPublicOnMap && formData.slug ? (
            <p className="mt-4 font-mono text-xs text-slate-400">
              Ficha pública:{" "}
              <a href={`/locales/${formData.slug}`} className="text-electric-yellow underline">
                /locales/{formData.slug}
              </a>
              {worlds50Rank ? (
                <span className="ml-2 text-electric-yellow">· World&apos;s 50 Best #{worlds50Rank}</span>
              ) : null}
            </p>
          ) : null}
        </div>

        <VenueDetailFieldsSection
          value={venueDetail}
          dressCode={formData.dressCode}
          theForkUrl={formData.theForkUrl}
          onChange={(patch) => setVenueDetail((prev) => ({ ...prev, ...patch }))}
          onDressCodeChange={(value) => setFormData((prev) => ({ ...prev, dressCode: value }))}
          onTheForkUrlChange={(value) => setFormData((prev) => ({ ...prev, theForkUrl: value }))}
        />

        {/* Sección: Lore del local (Guía pública) */}
        <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-red">
            📖 Lore del local (Guía pública)
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                El Veredicto
              </label>
              <textarea
                name="verdict"
                value={formData.verdict}
                onChange={handleInputChange}
                rows={3}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Historia
              </label>
              <textarea
                name="history"
                value={formData.history}
                onChange={handleInputChange}
                rows={5}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Año de fundación
              </label>
              <input
                type="number"
                name="foundationYear"
                value={formData.foundationYear}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Bebida insignia
              </label>
              <input
                type="text"
                name="signatureDrink"
                value={formData.signatureDrink}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Tags de ambiente (separados por coma)
              </label>
              <input
                type="text"
                name="vibeTags"
                value={formData.vibeTags}
                onChange={handleInputChange}
                placeholder="speakeasy, clásico, terraza"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Proveedor de reservas
              </label>
              <select
                name="reservationProvider"
                value={formData.reservationProvider}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              >
                <option value="">Automático / legacy</option>
                <option value="COVER_MANAGER">CoverManager</option>
                <option value="THE_FORK">TheFork</option>
                <option value="SEVEN_ROOMS">SevenRooms</option>
                <option value="OPEN_TABLE">OpenTable</option>
                <option value="EXTERNAL">Externo</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                URL de reserva unificada
              </label>
              <input
                type="url"
                name="reservationUrl"
                value={formData.reservationUrl}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sección: Integración TPV & Reposición Automática */}
        <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-red">
            ⚙️ Integración TPV & Telemetría Stock
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Proveedor de TPV
              </label>
              <select
                name="tpvProvider"
                value={formData.tpvProvider}
                onChange={handleInputChange}
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              >
                <option value="">Ninguno</option>
                <option value="revo">Revo</option>
                <option value="lightspeed">Lightspeed</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Token TPV / API Key
              </label>
              <input
                type="password"
                name="tpvToken"
                value={formData.tpvToken}
                onChange={handleInputChange}
                placeholder={
                  hasTpvToken
                    ? "Token configurado — escribe uno nuevo solo para cambiarlo"
                    : "••••••••••••••••"
                }
                autoComplete="new-password"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>

            <div className="md:col-span-2 border-t-2 border-black/40 pt-6">
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="checkbox"
                  id="autoReorderEnabled"
                  name="autoReorderEnabled"
                  checked={formData.autoReorderEnabled}
                  onChange={handleInputChange}
                  className="h-6 w-6 border-4 border-black bg-black text-electric-yellow focus:ring-0 cursor-pointer shadow-[2px_2px_0px_#000000]"
                />
                <label
                  htmlFor="autoReorderEnabled"
                  className="text-sm font-bold uppercase tracking-wider text-white cursor-pointer select-none"
                >
                  Activar Reposición Automática (FIFO)
                </label>
              </div>
              <p className="text-xs text-slate-400 mb-4 max-w-2xl leading-relaxed">
                Cuando el stock caiga por debajo del umbral, se generará una orden B2B automatizada
                en estado PENDING_APPROVAL optimizada por lotes de producción (FIFO).
              </p>
            </div>

            {formData.autoReorderEnabled && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Umbral mínimo global (unidades)
                </label>
                <input
                  type="number"
                  name="autoReorderThreshold"
                  value={formData.autoReorderThreshold}
                  onChange={handleInputChange}
                  min={0}
                  className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sección: Reservas Integradas (Iframes) */}
        <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
          <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-blue">
            📅 Central de Reservas (iFrames)
          </h2>
          <p className="mb-6 text-xs text-slate-400">
            TheFork (ficha o widget) se configura en Links y presencia online.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                CoverManager Widget URL
              </label>
              <input
                type="url"
                name="coverManagerUrl"
                value={formData.coverManagerUrl}
                onChange={handleInputChange}
                placeholder="https://www.covermanager.com/reservation/module/..."
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white focus:outline-none focus:border-electric-yellow shadow-[4px_4px_0px_#000000]"
              />
            </div>
          </div>

          {/* Vista Previa de los widgets de reservas */}
          {(formData.coverManagerUrl || formData.theForkUrl) && (
            <div className="mt-8 border-4 border-black bg-black p-6 shadow-[4px_4px_0px_#000000]">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-electric-yellow">
                🛠️ Vista Previa del Widget Activo
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {formData.coverManagerUrl && (
                  <div className="border-4 border-zinc-700 bg-zinc-900 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                      CoverManager Widget
                    </p>
                    <div className="relative aspect-video w-full overflow-hidden border-2 border-black bg-zinc-950">
                      <iframe
                        src={formData.coverManagerUrl}
                        className="h-full w-full border-none"
                        title="CoverManager Reservations"
                      />
                    </div>
                  </div>
                )}
                {formData.theForkUrl && (
                  <div className="border-4 border-zinc-700 bg-zinc-900 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                      TheFork Widget
                    </p>
                    <div className="relative aspect-video w-full overflow-hidden border-2 border-black bg-zinc-950">
                      <iframe
                        src={formData.theForkUrl}
                        className="h-full w-full border-none"
                        title="TheFork Reservations"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botón de Enviar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="border-4 border-black bg-electric-yellow px-8 py-4 font-mono text-lg font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_#000000] hover:bg-white transition-all active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000000] disabled:opacity-50"
          >
            {saving ? "Guardando expediente..." : "💾 Guardar Ajustes"}
          </button>
        </div>
      </form>
    </div>
  );
}
