#!/usr/bin/env tsx
import { importTmdbMovie, importTmdbTvSeries } from "@/lib/media/import-tmdb";
import prisma from "@/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const tvIdx = args.indexOf("--tv");
  const movieIdx = args.indexOf("--movie");
  const publish = args.includes("--publish");
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No hay usuario ADMIN");

  if (tvIdx >= 0) {
    const id = Number(args[tvIdx + 1]);
    const result = await importTmdbTvSeries(id, admin.id, { publish });
    console.log(`Serie importada: ${result.series.slug} (${result.episodeCount} episodios)`);
    return;
  }

  if (movieIdx >= 0) {
    const id = Number(args[movieIdx + 1]);
    const item = await importTmdbMovie(id, admin.id, publish);
    console.log(`Película importada: ${item.slug}`);
    return;
  }

  console.log("Uso: npm run import:tmdb -- --tv 1399 [--publish] | --movie 550 [--publish]");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
