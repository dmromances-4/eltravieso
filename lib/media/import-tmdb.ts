import type { MediaPublishStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureUniqueMediaSlug } from "@/lib/media/slug";
import {
  getTmdbMovie,
  getTmdbSeason,
  getTmdbTv,
  tmdbPosterUrl,
  yearFromDate,
} from "@/lib/media/tmdb";

export async function importTmdbMovie(tmdbId: number, createdById: string, publish = false) {
  const movie = await getTmdbMovie(tmdbId);
  const slug = await ensureUniqueMediaSlug(prisma, movie.title);
  const status: MediaPublishStatus = publish ? "PUBLISHED" : "DRAFT";

  return prisma.mediaItem.create({
    data: {
      title: movie.title,
      slug,
      kind: "FILM",
      summary: movie.overview ?? null,
      coverUrl: tmdbPosterUrl(movie.poster_path),
      sourceType: "EMBED",
      status,
      publishedAt: publish ? new Date() : null,
      createdById,
      tmdbId: movie.id,
      tmdbType: "movie",
      imdbId: movie.imdb_id ?? null,
      releaseYear: yearFromDate(movie.release_date),
      runtimeMins: movie.runtime ?? null,
      metadata: { genres: movie.genres?.map((g) => g.name) ?? [] },
    },
  });
}

export async function importTmdbTvSeries(
  tmdbId: number,
  createdById: string,
  options?: { seasons?: number[]; publish?: boolean },
) {
  const tv = await getTmdbTv(tmdbId);
  const slug = await ensureUniqueMediaSlug(prisma, tv.name);
  const status: MediaPublishStatus = options?.publish ? "PUBLISHED" : "DRAFT";

  const series = await prisma.mediaItem.create({
    data: {
      title: tv.name,
      slug,
      kind: "SERIES",
      summary: tv.overview ?? null,
      coverUrl: tmdbPosterUrl(tv.poster_path),
      sourceType: "EMBED",
      status,
      publishedAt: options?.publish ? new Date() : null,
      createdById,
      tmdbId: tv.id,
      tmdbType: "tv",
      imdbId: tv.external_ids?.imdb_id ?? null,
      releaseYear: yearFromDate(tv.first_air_date),
      metadata: { genres: tv.genres?.map((g) => g.name) ?? [], seasons: tv.number_of_seasons },
    },
  });

  const seasonNumbers =
    options?.seasons ??
    Array.from({ length: tv.number_of_seasons ?? 0 }, (_, i) => i + 1).filter((n) => n > 0);

  let episodeCount = 0;
  for (const seasonNumber of seasonNumbers) {
    const season = await getTmdbSeason(tmdbId, seasonNumber);
    for (const ep of season.episodes) {
      const epSlug = await ensureUniqueMediaSlug(prisma, `${tv.name}-s${seasonNumber}e${ep.episode_number}`);
      await prisma.mediaItem.create({
        data: {
          title: ep.name,
          slug: epSlug,
          kind: "SERIES_EPISODE",
          summary: ep.overview ?? null,
          coverUrl: tmdbPosterUrl(ep.still_path) ?? series.coverUrl,
          sourceType: "EMBED",
          parentId: series.id,
          seasonNumber: ep.season_number,
          episodeNumber: ep.episode_number,
          status,
          publishedAt: options?.publish ? new Date() : null,
          createdById,
          tmdbId: ep.id,
          tmdbType: "tv_episode",
          runtimeMins: ep.runtime ?? null,
          metadata: { seriesTmdbId: tmdbId },
        },
      });
      episodeCount += 1;
    }
  }

  return { series, episodeCount };
}
