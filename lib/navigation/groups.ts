export type NavLinkItem = { name: string; href: string; description?: string };

export type NavGroupKey = "discover" | "pro" | "community";

export type NavLinkConfig = {
  nameKey: string;
  href: string;
  descriptionKey: string;
  icon: NavIconName;
};

export type NavIconName =
  | "recipes"
  | "spirits"
  | "library"
  | "shop"
  | "blog"
  | "aiBar"
  | "map"
  | "screen"
  | "barOnline"
  | "forum";

export const NAV_GROUP_KEYS: Record<
  NavGroupKey,
  { labelKey: string; links: NavLinkConfig[] }
> = {
  discover: {
    labelKey: "nav.discover",
    links: [
      { nameKey: "nav.recipes", href: "/recetas", descriptionKey: "nav.descriptions.recipes", icon: "recipes" },
      { nameKey: "nav.spirits", href: "/alcoholes", descriptionKey: "nav.descriptions.spirits", icon: "spirits" },
      { nameKey: "nav.library", href: "/biblioteca", descriptionKey: "nav.descriptions.library", icon: "library" },
      { nameKey: "nav.shop", href: "/shop", descriptionKey: "nav.descriptions.shop", icon: "shop" },
      { nameKey: "nav.blog", href: "/blog", descriptionKey: "nav.descriptions.blog", icon: "blog" },
    ],
  },
  pro: {
    labelKey: "nav.pro",
    links: [
      { nameKey: "nav.aiBar", href: "/pro/tech-generator", descriptionKey: "nav.descriptions.aiBar", icon: "aiBar" },
      { nameKey: "nav.map", href: "/mapa", descriptionKey: "nav.descriptions.map", icon: "map" },
      { nameKey: "nav.screen", href: "/pantalla", descriptionKey: "nav.descriptions.screen", icon: "screen" },
    ],
  },
  community: {
    labelKey: "nav.community",
    links: [
      { nameKey: "nav.barOnline", href: "/bar-online", descriptionKey: "nav.descriptions.barOnline", icon: "barOnline" },
      { nameKey: "nav.forum", href: "/comunidad", descriptionKey: "nav.descriptions.forum", icon: "forum" },
    ],
  },
};

export const NAV_QUICK_LINKS: NavLinkConfig[] = [
  NAV_GROUP_KEYS.discover.links[0],
  NAV_GROUP_KEYS.discover.links[3],
  NAV_GROUP_KEYS.pro.links[1],
];

/** @deprecated Use NAV_GROUP_KEYS with useTranslations */
export const NAV_GROUPS = {
  discover: {
    label: "Descubrir",
    links: [
      { name: "Recetas", href: "/recetas" },
      { name: "Alcoholes", href: "/alcoholes" },
      { name: "Biblioteca", href: "/biblioteca" },
      { name: "Shop", href: "/shop" },
      { name: "Blog", href: "/blog" },
    ],
  },
  pro: {
    label: "Pro",
    links: [
      { name: "Barra IA", href: "/pro/tech-generator" },
      { name: "Mapa", href: "/mapa" },
      { name: "Pantalla", href: "/pantalla" },
    ],
  },
  community: {
    label: "Comunidad",
    links: [
      { name: "Bar Online", href: "/bar-online" },
      { name: "Comunidad", href: "/comunidad" },
    ],
  },
} as const;
