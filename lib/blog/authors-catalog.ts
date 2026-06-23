import writersData from "@/data/gastronomic-writers.json";
import type { GastronomicWriterRecord } from "@/types/editorial-author";

const writers = writersData as GastronomicWriterRecord[];

export function getAllWriters(): GastronomicWriterRecord[] {
  return [...writers].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
}

export function getWriterBySlug(slug: string): GastronomicWriterRecord | null {
  return writers.find((w) => w.slug === slug) ?? null;
}

export function getFeaturedWriters(): GastronomicWriterRecord[] {
  return getAllWriters().filter((w) => w.featured);
}

export function validateWritersCatalog(): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  for (const writer of writers) {
    if (slugs.has(writer.slug)) {
      errors.push(`Slug duplicado: ${writer.slug}`);
    }
    slugs.add(writer.slug);
    if (!writer.name?.trim()) errors.push(`Nombre vacío: ${writer.slug}`);
    if (!writer.bio?.trim()) errors.push(`Bio vacía: ${writer.slug}`);
  }
  return errors;
}
