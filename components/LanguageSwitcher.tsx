"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTransition } from "react";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();

  async function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;

    if (session?.user) {
      try {
        await fetch("/api/user/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        });
      } catch {
        // non-blocking
      }
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={cn("flex items-center gap-1 rounded-pill border border-white/15 bg-white/5 p-0.5", className)}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((item) => (
        <button
          key={item}
          type="button"
          disabled={pending}
          onClick={() => switchLocale(item)}
          className={cn(
            "min-h-[36px] min-w-[36px] rounded-pill px-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
            item === locale
              ? "bg-electric-yellow text-black"
              : "text-slate-300 hover:text-white",
          )}
          aria-pressed={item === locale}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
