import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import VenueHero from "@/components/venues/VenueHero";
import VenueDetailBlocks from "@/components/venues/VenueDetailBlocks";
import VenueLoreBlocks from "@/components/venues/VenueLoreBlocks";
import ReservationWidget from "@/components/venues/ReservationWidget";
import { getPublicVenueBySlug, listAllPublicVenueSlugs } from "@/lib/venues/catalog";
import { resolveReservationConfig } from "@/lib/venues/reservation";
import type { AppLocale } from "@/i18n/routing";

export const revalidate = 3600;

type Props = { params: { slug: string; locale: AppLocale } };

export async function generateStaticParams() {
  const slugs = await listAllPublicVenueSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const venue = await getPublicVenueBySlug(params.slug, params.locale);
  if (!venue) return { title: "Local no encontrado" };

  const rankPart =
    venue.worlds50bestRank && venue.worlds50bestRank <= 50
      ? ` #${venue.worlds50bestRank} World's 50 Best ·`
      : "";

  const description =
    venue.verdict?.slice(0, 155) ??
    `${venue.name} en ${venue.city}.${venue.signatureDrink ? ` Bebida insignia: ${venue.signatureDrink}.` : ""}`;

  return {
    title: `${venue.name} en ${venue.city}${rankPart} | Guía El Travieso`,
    description,
    openGraph: {
      title: venue.name,
      description,
      images: venue.photoUrl ? [{ url: venue.photoUrl }] : undefined,
    },
  };
}

function buildJsonLd(venue: NonNullable<Awaited<ReturnType<typeof getPublicVenueBySlug>>>) {
  const isRestaurant = venue.venueType === "restaurante";
  const schemaType = isRestaurant ? "Restaurant" : "BarOrPub";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": schemaType,
        name: venue.name,
        address: venue.address
          ? {
              "@type": "PostalAddress",
              streetAddress: venue.address,
              addressLocality: venue.city,
              addressCountry: venue.country ?? undefined,
            }
          : undefined,
        telephone: venue.phone ?? undefined,
        image: venue.photoUrl ?? undefined,
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/locales/${venue.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Guía", item: "/mapa" },
          { "@type": "ListItem", position: 2, name: venue.name },
        ],
      },
    ],
  };
}

export default async function LocalePage({ params }: Props) {
  const venue = await getPublicVenueBySlug(params.slug, params.locale);
  if (!venue) notFound();

  const reservation = resolveReservationConfig(
    {
      reservationProvider: venue.reservationProvider,
      reservationUrl: venue.reservationUrl,
      coverManagerUrl: venue.coverManagerUrl,
      theForkUrl: venue.theForkUrl,
    },
    {
      bookingWidgetEnabled:
        venue.source === "editorial" ? false : venue.bookingWidgetEnabled,
    },
  );

  const jsonLd = buildJsonLd(venue);

  return (
    <main className="min-h-screen bg-night pb-16 pt-28 text-white">
      <div className="mx-auto max-w-4xl space-y-8 px-6 sm:px-8">
        <nav className="font-mono text-xs uppercase tracking-widest text-slate-500">
          <Link href="/mapa" className="hover:text-electric-yellow">
            Guía
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{venue.name}</span>
        </nav>

        <VenueHero venue={venue} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VenueDetailBlocks venue={venue} />
            <VenueLoreBlocks venue={venue} />
          </div>
          <div className="lg:col-span-1">
            <ReservationWidget
              config={reservation}
              externalWebsite={venue.externalWebsite}
              isEditorial={venue.source === "editorial"}
            />
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
