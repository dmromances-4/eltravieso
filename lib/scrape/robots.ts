const robotsCache = new Map<string, string[]>();

export async function getDisallows(origin: string, userAgent: string): Promise<string[]> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;

  const disallows: string[] = [];
  try {
    const res = await fetchWithTimeout(
      `${origin}/robots.txt`,
      { headers: { "User-Agent": userAgent } },
      diffordsTimeoutMs(),
    );
    if (res.ok) {
      const text = await res.text();
      let appliesToUs = true;
      for (const line of text.split(/\r?\n/)) {
        const l = line.trim();
        if (/^user-agent:/i.test(l)) {
          const ua = l.split(":")[1]?.trim() ?? "*";
          appliesToUs = ua === "*" || userAgent.toLowerCase().includes(ua.toLowerCase());
        } else if (appliesToUs && /^disallow:/i.test(l)) {
          const p = l.split(":").slice(1).join(":").trim();
          if (p) disallows.push(p);
        }
      }
    }
  } catch {
    // sin robots.txt accesible
  }

  robotsCache.set(origin, disallows);
  return disallows;
}

export async function isUrlAllowed(target: string, userAgent: string): Promise<boolean> {
  try {
    const u = new URL(target);
    const disallows = await getDisallows(u.origin, userAgent);
    return (
      !disallows.includes("/") &&
      !disallows.some((d) => d !== "/" && u.pathname.startsWith(d))
    );
  } catch {
    return false;
  }
}
