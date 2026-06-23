import fs from "fs";
import path from "path";
import { config } from "dotenv";
import prisma from "../lib/prisma";
import {
  editorialToTripAdvisorAmenities,
  editorialToTripAdvisorLabels,
  mapEditorialHeuristics,
} from "../lib/venues/enrich-editorial-heuristics";
import { venueGuideEntryToNormalized } from "../lib/venues/guide-from-db";
import { resolveTripAdvisorListing } from "../lib/venues/resolve-tripadvisor-url";
import type { NormalizedVenueGuide } from "../lib/venues/types";
import { requireDbPreflight } from "../lib/db-preflight";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });



const DATA_FILE = path.resolve(process.cwd(), "data", "venues-worlds50best.json");

const OUT_FILE = path.resolve(process.cwd(), "data", "tripadvisor-curated.csv");



const args = process.argv.slice(2);

const limitArg = args.find((a) => a.startsWith("--limit="));

const limit = limitArg ? Number(limitArg.split("=")[1]) : 50;

const europeOnly = args.includes("--europe");

const globalOnly = args.includes("--global");

const resolveUrls = args.includes("--resolve-urls");

const fromDb = args.includes("--from-db");



function csvEscape(value: string): string {

  if (value.includes(",") || value.includes('"')) {

    return `"${value.replace(/"/g, '""')}"`;

  }

  return value;

}



function pickPilotVenues(venues: NormalizedVenueGuide[]): NormalizedVenueGuide[] {

  const filtered = venues.filter((v) => {

    if (globalOnly) return v.listScope === "GLOBAL" || v.continent === "GLOBAL";

    if (europeOnly) {

      return (

        v.continent === "EUROPE" ||

        /spain|italy|france|germany|portugal|uk|london|madrid|barcelona|paris|rome|milan/i.test(

          `${v.city} ${v.country ?? ""}`,

        )

      );

    }

    return true;

  });



  return [...filtered]

    .sort((a, b) => a.worlds50bestRank - b.worlds50bestRank)

    .slice(0, limit);

}



function priceLevelFromRange(priceRange: string | null | undefined): number {

  const map: Record<string, number> = {

    under_15: 1,

    range_15_30: 2,

    range_30_50: 3,

    over_50: 4,

  };

  return priceRange ? (map[priceRange] ?? 3) : 3;

}



function editorialCorpus(venue: NormalizedVenueGuide): string {

  return [venue.name, venue.verdict, venue.history, venue.chefName].filter(Boolean).join("\n\n");

}



async function loadVenues(): Promise<NormalizedVenueGuide[]> {

  if (fromDb) {

    await requireDbPreflight("prepare:tripadvisor-curated");

    const rows = await prisma.venueGuideEntry.findMany({

      where: { isPublished: true },

      orderBy: { worlds50bestRank: "asc" },

    });

    return rows.map(venueGuideEntryToNormalized);

  }



  if (!fs.existsSync(DATA_FILE)) {

    console.error(`No existe ${DATA_FILE}. Usa --from-db o ejecuta scrape:venues primero.`);

    process.exit(1);

  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as NormalizedVenueGuide[];

}



async function main() {

  const venues = await loadVenues();

  const pilot = pickPilotVenues(venues);



  const header =

    "slug,tripadvisorUrl,rating,address,tripadvisorPlaceId,googleBusinessId,priceLevel,cuisineLabels,amenities,features,awards";

  const lines = [header];



  let resolved = 0;



  for (const venue of pilot) {

    const corpus = editorialCorpus(venue);

    const editorial = mapEditorialHeuristics({

      name: venue.name,

      history: venue.history,

      verdict: venue.verdict,

      chefName: venue.chefName,

    });

    const ta = editorialToTripAdvisorLabels(editorial);

    const amenities = editorialToTripAdvisorAmenities(editorial, corpus);

    const features = [...new Set(ta.features)];

    const awards = [...new Set([...(venue.awards ?? []), ...ta.awards])];



    let tripadvisorUrl = venue.tripadvisorUrl ?? "";

    let tripadvisorPlaceId = venue.tripadvisorPlaceId ?? "";



    if (resolveUrls && !tripadvisorUrl) {

      const match = await resolveTripAdvisorListing(venue.name, venue.city);

      if (match) {

        tripadvisorUrl = match.url;

        tripadvisorPlaceId = match.placeId;

        resolved += 1;

        console.log(`  ✓ ${venue.slug} → ${match.placeId}`);

      } else {

        console.warn(`  ✗ ${venue.slug}: sin ficha TA`);

      }

    }



    const cuisineLabels = [

      ...new Set([

        ...ta.cuisineLabels,

        ...(venue.cuisineTypes ?? []).map((slug) => {

          const reverse: Record<string, string> = {

            japonesa: "japanese",

            espanola: "spanish",

            italiana: "italian",

            francesa: "french",

            mexicana: "mexican",

            peruana: "peruvian",

            mediterranea: "mediterranean",

            marisqueria: "seafood",

            vegana: "vegan",

            asiatica: "asian",

            thai: "thai",

            india: "indian",

            griega: "greek",

            americana: "american",

            fusion: "fusion",

            internacional: "international",

          };

          return reverse[slug] ?? slug;

        }),

      ]),

    ];



    const row = [

      venue.slug,

      tripadvisorUrl,

      venue.tripadvisorRating != null ? String(venue.tripadvisorRating) : "",

      venue.address ?? "",

      tripadvisorPlaceId,

      venue.googleBusinessId ?? "",

      String(priceLevelFromRange(venue.priceRange)),

      cuisineLabels.join("|"),

      amenities.join("|"),

      features.join("|"),

      awards.join("|"),

    ].map((cell) => csvEscape(cell));



    lines.push(row.join(","));

  }



  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf-8");

  console.log(`✓ ${pilot.length} filas pilot en ${OUT_FILE}`);

  if (resolveUrls) console.log(`  URLs resueltas: ${resolved}/${pilot.length}`);

  console.log("  Importar: npm run enrich:tripadvisor -- --import data/tripadvisor-curated.csv");

}



main()

  .catch((err) => {

    console.error(err);

    process.exit(1);

  })

  .finally(() => prisma.$disconnect());
