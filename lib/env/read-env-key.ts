/** Lee claves de entorno ignorando vacíos y espacios (`.env.local` con `KEY=` sin valor). */
export function readEnvKey(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^['"].*['"]$/.test(trimmed)) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

export function geminiKeyFormatHint(key: string): string | null {
  if (key.startsWith("AIza") || key.startsWith("AQ.")) return null;
  return "Las claves de Google AI Studio suelen empezar por AIza… o AQ.…";
}
