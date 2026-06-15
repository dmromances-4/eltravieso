/** Normalize label → stable slug id */
export function slugifyId(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function hashSeed(parts: string[]): number {
  const str = parts.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickFrom<T>(items: T[], seed: number, index: number): T {
  if (items.length === 0) throw new Error("pickFrom: empty array");
  return items[(seed + index) % items.length]!;
}
