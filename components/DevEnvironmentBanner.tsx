"use client";

import { useEffect, useState } from "react";
import type { DevHealthReport } from "@/lib/dev/health";

const DISMISS_KEY = "travieso-dev-banner-dismissed";

export default function DevEnvironmentBanner() {
  const [report, setReport] = useState<DevHealthReport | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    fetch("/api/dev/health")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .catch(() => null);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (dismissed || !report || report.warnings.length === 0) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 inset-x-0 z-[100] border-t border-white/10 bg-[#151515]/95 px-4 py-3 text-sm backdrop-blur-md"
    >
      <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-200">Entorno local</p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {report.warnings.slice(0, 2).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <code className="text-xs text-slate-500">npm run check:local</code>
          <button type="button" onClick={dismiss} className="rounded-pill border border-white/15 px-3 py-1 text-xs text-slate-300 hover:bg-white/5">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
