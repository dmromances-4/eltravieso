"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const t = useTranslations("nav");

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="min-h-[44px] w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
    >
      {t("logout")}
    </button>
  );
}
