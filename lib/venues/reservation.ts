import type { ReservationProvider } from "@prisma/client";

export type ReservationMode = "iframe" | "cta";

export type ReservationConfig = {
  provider: ReservationProvider | null;
  url: string | null;
  mode: ReservationMode;
  embedUrl?: string;
};

type BarReservationFields = {
  reservationProvider?: ReservationProvider | null;
  reservationUrl?: string | null;
  coverManagerUrl?: string | null;
  theForkUrl?: string | null;
};

const COVER_EMBED_PATTERNS = [/covermanager\.com/i, /embed/i, /iframe/i];

function isCoverEmbedUrl(url: string): boolean {
  return COVER_EMBED_PATTERNS.some((p) => p.test(url));
}

function inferProviderFromUrl(url: string): ReservationProvider {
  if (/covermanager/i.test(url)) return "COVER_MANAGER";
  if (/thefork|lafourchette/i.test(url)) return "THE_FORK";
  if (/sevenrooms/i.test(url)) return "SEVEN_ROOMS";
  if (/opentable/i.test(url)) return "OPEN_TABLE";
  return "EXTERNAL";
}

export function resolveReservationConfig(
  bar: BarReservationFields,
  options?: { bookingWidgetEnabled?: boolean },
): ReservationConfig {
  let provider = bar.reservationProvider ?? null;
  let url = bar.reservationUrl?.trim() || null;

  if (!url && bar.coverManagerUrl?.trim()) {
    url = bar.coverManagerUrl.trim();
    provider = provider ?? "COVER_MANAGER";
  }
  if (!url && bar.theForkUrl?.trim()) {
    url = bar.theForkUrl.trim();
    provider = provider ?? "THE_FORK";
  }

  if (url && !provider) {
    provider = inferProviderFromUrl(url);
  }

  if (!url) {
    return { provider: null, url: null, mode: "cta" };
  }

  const allowEmbed = options?.bookingWidgetEnabled !== false;

  if (allowEmbed && provider === "COVER_MANAGER" && isCoverEmbedUrl(url)) {
    return { provider, url, mode: "iframe", embedUrl: url };
  }

  return { provider, url, mode: "cta" };
}
