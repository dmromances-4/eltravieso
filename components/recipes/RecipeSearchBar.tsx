"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type RecipeSearchMatch = {
  title: string;
  slug: string;
  ingredients: string[];
  href: string;
};

type Props = {
  variant?: "compact" | "full";
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  showTypeahead?: boolean;
  className?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function RecipeSearchBar({
  variant = "full",
  defaultQuery = "",
  onQueryChange,
  showTypeahead = true,
  className,
}: Props) {
  const t = useTranslations("search");
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [matches, setMatches] = useState<RecipeSearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    if (!showTypeahead) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(trimmed)}`);
        const data = (await res.json()) as { matches?: RecipeSearchMatch[] };
        setMatches(data.matches ?? []);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showTypeahead]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      onQueryChange?.(value);
      if (showTypeahead) setOpen(true);
    },
    [onQueryChange, showTypeahead],
  );

  const navigateToMatch = (match: RecipeSearchMatch) => {
    setOpen(false);
    router.push(match.href);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (matches[0]) {
      navigateToMatch(matches[0]);
      return;
    }
    if (trimmed) {
      router.push(`/recetas?q=${encodeURIComponent(trimmed)}`);
      setOpen(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <div ref={rootRef} className={cn("relative", isCompact ? "w-full max-w-[14rem] xl:max-w-xs" : "w-full", className)}>
      <form onSubmit={onSubmit} role="search">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onFocus={() => showTypeahead && setOpen(true)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            aria-controls={showTypeahead ? listId : undefined}
            aria-autocomplete={showTypeahead ? "list" : undefined}
            className={cn("search-input", isCompact && "py-2.5 text-sm")}
          />
        </div>
      </form>

      {showTypeahead && open && query.trim().length >= 2 ? (
        <div
          id={listId}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-card border border-slate-200 bg-white shadow-subtle"
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-slate-500">{t("loading")}</p>
          ) : matches.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto py-1">
              {matches.map((match) => (
                <li key={match.slug}>
                  <button
                    type="button"
                    onClick={() => navigateToMatch(match)}
                    className="block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-900">{match.title}</p>
                    {match.ingredients.length > 0 ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {match.ingredients.slice(0, 4).join(" · ")}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-slate-500">{t("noResults")}</p>
          )}
          <div className="border-t border-slate-100 px-4 py-2">
            <Link href={`/recetas?q=${encodeURIComponent(query.trim())}`} className="text-xs font-medium text-electric-blue hover:underline">
              {t("seeAll")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { normalize as normalizeSearchQuery };
