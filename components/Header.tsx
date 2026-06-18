"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, usePathname } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/CartContext";
import BrandLogo from "@/components/brand/BrandLogo";
import MegaNav, { MobileNavLinks } from "@/components/navigation/MegaNav";
import RecipeSearchBar from "@/components/recipes/RecipeSearchBar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export default function Header() {
  const t = useTranslations();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { count: cartCount } = useCart();

  const isAuthenticated = status === "authenticated" && session?.user;
  const isAdminRoute = useMemo(() => pathname.startsWith("/admin"), [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300",
          isScrolled
            ? "border-b border-slate-200 bg-white/95 py-2.5 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-white/80 py-4 backdrop-blur-sm",
        )}
      >
        <div className="section-shell flex items-center gap-3 lg:gap-4">
          <BrandLogo className="z-50 shrink-0" />

          <MegaNav className="mx-auto flex-1 justify-center" />

          <div className="hidden shrink-0 md:block">
            <RecipeSearchBar variant="compact" />
          </div>

          <div className="z-50 flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitcher className="hidden sm:flex" />

            <Link
              href="/cart"
              className="relative min-h-[44px] min-w-[44px] p-2 text-slate-700 transition-colors hover:text-electric-blue"
              aria-label={`${t("nav.cart")}${cartCount > 0 ? ` (${cartCount})` : ""}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-pill bg-electric-yellow px-1 text-[10px] font-bold text-slate-900">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>

            {isAuthenticated ? (
              <Link
                href="/cuenta"
                className="hidden min-h-[44px] items-center gap-2 rounded-pill border border-slate-200 px-3 py-1.5 md:inline-flex hover:border-slate-300"
              >
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  {session.user.image ? (
                    <Image src={session.user.image} alt="" fill className="object-cover" sizes="28px" unoptimized />
                  ) : (
                    <span className="text-xs font-semibold text-electric-blue">
                      {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="max-w-[100px] truncate text-sm font-medium text-slate-700">
                  {session.user.name?.split(" ")[0] || t("nav.account")}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden min-h-[44px] rounded-pill border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:border-electric-blue/40 md:inline-flex md:items-center"
              >
                {t("nav.login")}
              </Link>
            )}

            <button
              type="button"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-800 lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-white pb-[env(safe-area-inset-bottom)] pt-24 lg:hidden"
          >
            <nav className="section-shell space-y-6 pb-12">
              <RecipeSearchBar variant="full" />
              <LanguageSwitcher className="sm:hidden" />
              <MobileNavLinks onNavigate={() => setIsMobileMenuOpen(false)} />
              <div className="border-t border-slate-200 pt-6">
                <Link href={isAuthenticated ? "/cuenta" : "/login"} className="text-sm font-medium text-electric-blue">
                  {isAuthenticated ? t("nav.account") : `${t("nav.login")} / ${t("nav.register")}`}
                </Link>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
