"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Capacitor } from "@capacitor/core";
import { Link } from "@/i18n/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import { NAV_GROUP_KEYS } from "@/lib/navigation/groups";

export default function Footer() {
  const t = useTranslations();
  const [hideOnNative, setHideOnNative] = useState(false);

  useEffect(() => {
    setHideOnNative(Capacitor.isNativePlatform());
  }, []);

  if (hideOnNative) return null;

  const discoverLinks = NAV_GROUP_KEYS.discover.links.map((link) => ({
    href: link.href,
    name: t(link.nameKey),
  }));

  const proCommunityLinks = [
    ...NAV_GROUP_KEYS.pro.links,
    ...NAV_GROUP_KEYS.community.links,
  ].map((link) => ({
    href: link.href,
    name: t(link.nameKey),
  }));

  return (
    <footer className="border-t border-slate-200 bg-white py-16 text-slate-600">
      <div className="section-shell">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-4 md:col-span-2">
            <BrandLogo size="md" />
            <p className="max-w-md text-sm leading-7 text-slate-500">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">{t("footer.discover")}</h3>
            <ul className="space-y-3 text-sm">
              {discoverLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-500 transition-colors hover:text-electric-blue">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">{t("footer.proCommunity")}</h3>
            <ul className="space-y-3 text-sm">
              {proCommunityLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-500 transition-colors hover:text-electric-blue">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/aviso-legal" className="hover:text-slate-700">
              {t("footer.legalNotice")}
            </Link>
            <Link href="/politica-privacidad" className="hover:text-slate-700">
              {t("footer.privacy")}
            </Link>
            <Link href="/terminos-y-condiciones" className="hover:text-slate-700">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
