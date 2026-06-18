"use client";

import {
  VENUE_AWARDS,
  VENUE_CUISINE_TYPES,
  VENUE_ESTABLISHMENT_TYPES,
  VENUE_FEATURES,
  VENUE_IDEAL_FOR,
  VENUE_PREFERENCE_GROUPS,
  VENUE_PRICE_RANGES,
  type TaxonomyOption,
} from "@/lib/venues/taxonomy";

export type VenueDetailFormState = {
  establishmentTypes: string[];
  cuisineTypes: string[];
  starDishes: string[];
  idealFor: string[];
  venueFeatures: string[];
  neighborhood: string;
  priceRange: string;
  dailyMenuEnabled: boolean;
  dailyMenuNote: string;
  awards: string[];
  venuePreferences: string[];
  instagramUrl: string;
  tiktokUrl: string;
  tripadvisorUrl: string;
};

export const EMPTY_VENUE_DETAIL_FORM: VenueDetailFormState = {
  establishmentTypes: [],
  cuisineTypes: [],
  starDishes: [],
  idealFor: [],
  venueFeatures: [],
  neighborhood: "",
  priceRange: "",
  dailyMenuEnabled: false,
  dailyMenuNote: "",
  awards: [],
  venuePreferences: [],
  instagramUrl: "",
  tiktokUrl: "",
  tripadvisorUrl: "",
};

type Props = {
  value: VenueDetailFormState;
  dressCode: string;
  theForkUrl: string;
  onChange: (patch: Partial<VenueDetailFormState>) => void;
  onDressCodeChange: (value: string) => void;
  onTheForkUrlChange: (value: string) => void;
};

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: TaxonomyOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((opt) => (
        <label
          key={opt.id}
          className="flex cursor-pointer items-center gap-3 border-2 border-black bg-black px-3 py-2 text-sm shadow-[2px_2px_0px_#000000]"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.id)}
            onChange={() => onToggle(opt.id)}
            className="h-4 w-4 border-2 border-black"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function VenueDetailFieldsSection({
  value,
  dressCode,
  theForkUrl,
  onChange,
  onDressCodeChange,
  onTheForkUrlChange,
}: Props) {
  const toggle =
    (field: keyof Pick<VenueDetailFormState, "establishmentTypes" | "cuisineTypes" | "idealFor" | "venueFeatures" | "awards" | "venuePreferences">) =>
    (id: string) => {
      onChange({ [field]: toggleInList(value[field], id) });
    };

  const starDishesText = value.starDishes.join(", ");

  return (
    <>
      <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-2 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-yellow">
          🍽️ Identidad y gastronomía
        </h2>
        <p className="mb-6 text-xs text-slate-400">
          En el futuro estos datos podrán importarse desde Google Business o TripAdvisor.
        </p>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Tipo de establecimiento
            </h3>
            <CheckboxGrid
              options={VENUE_ESTABLISHMENT_TYPES}
              selected={value.establishmentTypes}
              onToggle={toggle("establishmentTypes")}
            />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Tipo de cocina
            </h3>
            <CheckboxGrid
              options={VENUE_CUISINE_TYPES}
              selected={value.cuisineTypes}
              onToggle={toggle("cuisineTypes")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Platos estrella / especialidades (3–5, separados por coma)
            </label>
            <input
              type="text"
              value={starDishesText}
              onChange={(e) =>
                onChange({
                  starDishes: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 5),
                })
              }
              placeholder="Tortilla de patata, croquetas, tarta de queso"
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-blue">
          🌆 Ambiente y ubicación
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Ideal para
            </h3>
            <CheckboxGrid
              options={VENUE_IDEAL_FOR}
              selected={value.idealFor}
              onToggle={toggle("idealFor")}
            />
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Características del local
            </h3>
            <CheckboxGrid
              options={VENUE_FEATURES}
              selected={value.venueFeatures}
              onToggle={toggle("venueFeatures")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Barrio / zona
            </label>
            <input
              type="text"
              value={value.neighborhood}
              onChange={(e) => onChange({ neighborhood: e.target.value })}
              placeholder="Barrio de las Letras, frente a la playa…"
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-red">
          💶 Precios y propuesta de valor
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Ticket medio
            </label>
            <select
              value={value.priceRange}
              onChange={(e) => onChange({ priceRange: e.target.value })}
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            >
              <option value="">Sin indicar</option>
              {VENUE_PRICE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 pt-6">
            <input
              type="checkbox"
              id="dailyMenuEnabled"
              checked={value.dailyMenuEnabled}
              onChange={(e) => onChange({ dailyMenuEnabled: e.target.checked })}
              className="h-6 w-6 border-4 border-black bg-black"
            />
            <label htmlFor="dailyMenuEnabled" className="text-sm font-bold uppercase">
              Menú del día / ofertas
            </label>
          </div>
          {value.dailyMenuEnabled ? (
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Detalle de menú u ofertas
              </label>
              <input
                type="text"
                value={value.dailyMenuNote}
                onChange={(e) => onChange({ dailyMenuNote: e.target.value })}
                placeholder="Menú del día 14,90€ entre semana"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
          ) : null}
          <div className="md:col-span-2">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Galardones / premios
            </h3>
            <CheckboxGrid
              options={VENUE_AWARDS}
              selected={value.awards}
              onToggle={toggle("awards")}
            />
          </div>
        </div>
      </div>

      <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-white">
          ✅ Preferencias del local
        </h2>
        <div className="space-y-8">
          {VENUE_PREFERENCE_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
              <CheckboxGrid
                options={group.options}
                selected={value.venuePreferences}
                onToggle={toggle("venuePreferences")}
              />
            </div>
          ))}
          {value.venuePreferences.includes("dress_code") ? (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Detalle del dress code
              </label>
              <input
                type="text"
                value={dressCode}
                onChange={(e) => onDressCodeChange(e.target.value)}
                placeholder="Smart casual, sin chanclas…"
                className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-4 border-black bg-zinc-900 p-6 shadow-[6px_6px_0px_#000000]">
        <h2 className="mb-6 border-b-4 border-black pb-2 text-xl font-bold uppercase tracking-wider text-electric-yellow">
          🔗 Links y presencia online
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Instagram (URL o @usuario)
            </label>
            <input
              type="text"
              value={value.instagramUrl}
              onChange={(e) => onChange({ instagramUrl: e.target.value })}
              placeholder="@ellocal o https://instagram.com/…"
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              TikTok (URL o @usuario)
            </label>
            <input
              type="text"
              value={value.tiktokUrl}
              onChange={(e) => onChange({ tiktokUrl: e.target.value })}
              placeholder="@ellocal"
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              TripAdvisor (URL directa)
            </label>
            <input
              type="url"
              value={value.tripadvisorUrl}
              onChange={(e) => onChange({ tripadvisorUrl: e.target.value })}
              placeholder="https://www.tripadvisor.es/…"
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              TheFork (URL directa)
            </label>
            <input
              type="url"
              value={theForkUrl}
              onChange={(e) => onTheForkUrlChange(e.target.value)}
              placeholder="https://www.thefork.es/…"
              className="w-full border-4 border-black bg-black px-4 py-3 font-mono text-white shadow-[4px_4px_0px_#000000] focus:border-electric-yellow focus:outline-none"
            />
          </div>
        </div>
      </div>
    </>
  );
}
