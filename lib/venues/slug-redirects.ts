import fs from "fs";
import path from "path";

const AUDIT_DIR = path.resolve(process.cwd(), "data/audits");

let redirectCache: Map<string, string> | null = null;

function addRedirect(map: Map<string, string>, from: string, to: string) {
  if (!from || !to || from === to) return;
  const existingTarget = map.get(to);
  map.set(from, existingTarget ?? to);
}

function loadFromAuditFiles(): Map<string, string> {
  const map = new Map<string, string>();

  const canonicalPath = path.join(AUDIT_DIR, "venue-canonical-merge.json");
  if (fs.existsSync(canonicalPath)) {
    const data = JSON.parse(fs.readFileSync(canonicalPath, "utf-8")) as {
      merges?: Array<{ canonicalSlug: string; mergedSlugs?: string[] }>;
    };
    for (const merge of data.merges ?? []) {
      for (const oldSlug of merge.mergedSlugs ?? []) {
        addRedirect(map, oldSlug, merge.canonicalSlug);
      }
    }
  }

  const migrationPath = path.join(AUDIT_DIR, "venue-slug-migration.json");
  if (fs.existsSync(migrationPath)) {
    const data = JSON.parse(fs.readFileSync(migrationPath, "utf-8")) as {
      migrations?: Array<{ oldSlug: string; newSlug: string; changed?: boolean }>;
    };
    for (const row of data.migrations ?? []) {
      if (row.changed !== false && row.oldSlug && row.newSlug) {
        addRedirect(map, row.oldSlug, row.newSlug);
      }
    }
  }

  return map;
}

export function getVenueSlugRedirects(): Map<string, string> {
  if (!redirectCache) {
    redirectCache = loadFromAuditFiles();
  }
  return redirectCache;
}

/** Devuelve el slug canónico si el solicitado fue absorbido en una fusión. */
export function resolveCanonicalVenueSlug(slug: string): string | null {
  const redirects = getVenueSlugRedirects();
  const target = redirects.get(slug);
  if (!target || target === slug) return null;

  let current = target;
  const visited = new Set<string>([slug]);
  while (redirects.has(current) && !visited.has(current)) {
    visited.add(current);
    current = redirects.get(current)!;
  }
  return current;
}

export function clearVenueSlugRedirectCache(): void {
  redirectCache = null;
}
