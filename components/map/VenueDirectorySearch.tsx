"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
};

export default function VenueDirectorySearch({ value, onChange, resultCount }: Props) {
  const t = useTranslations("map");
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => {
      onChangeRef.current(draft);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [draft, value]);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">{t("searchPlaceholder")}</span>
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-card border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {resultCount != null && draft.trim() && resultCount === 0 ? (
        <p className="font-mono text-xs text-slate-500">{t("noResults")}</p>
      ) : null}
    </div>
  );
}
