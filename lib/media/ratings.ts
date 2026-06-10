import prisma from "@/lib/prisma";
import { validateRatingScore } from "@/lib/media/validate";

export async function recalculateMediaRating(mediaItemId: string) {
  const agg = await prisma.mediaRating.aggregate({
    where: { mediaItemId },
    _avg: { score: true },
    _count: { score: true },
  });

  await prisma.mediaItem.update({
    where: { id: mediaItemId },
    data: {
      ratingAvg: agg._avg.score ?? 0,
      ratingCount: agg._count.score,
    },
  });

  return { avg: agg._avg.score ?? 0, count: agg._count.score };
}

export async function upsertMediaRating(mediaItemId: string, userId: string, score: number) {
  const error = validateRatingScore(score);
  if (error) throw new Error(error);

  await prisma.mediaRating.upsert({
    where: { mediaItemId_userId: { mediaItemId, userId } },
    create: { mediaItemId, userId, score },
    update: { score },
  });

  return recalculateMediaRating(mediaItemId);
}

export async function bumpCommentCount(mediaItemId: string, delta: number) {
  await prisma.mediaItem.update({
    where: { id: mediaItemId },
    data: { commentCount: { increment: delta } },
  });
}
