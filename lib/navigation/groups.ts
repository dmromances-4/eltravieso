export type NavLinkItem = { name: string; href: string };

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
