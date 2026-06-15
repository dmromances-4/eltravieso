export function readTimeoutMs(envKey: string, defaultMs: number): number {
  const raw = process.env[envKey];
  const parsed = raw ? Number(raw) : defaultMs;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultMs;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = readTimeoutMs("RECIPE_COVER_FETCH_TIMEOUT_MS", 15_000),
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Fetch timeout (${timeoutMs}ms): ${url.slice(0, 80)}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timeout after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function jobTimeoutMs(): number {
  return readTimeoutMs("RECIPE_COVER_JOB_TIMEOUT_MS", 90_000);
}

export function diffordsTimeoutMs(): number {
  return readTimeoutMs("RECIPE_COVER_DIFFORDS_TIMEOUT_MS", 20_000);
}
