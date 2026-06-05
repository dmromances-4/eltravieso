export function clientSafeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== "production") {
    return error instanceof Error ? error.message : fallback;
  }
  return fallback;
}

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}
