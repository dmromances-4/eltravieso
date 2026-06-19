export type NavLinkItem = { name: string; href: string; description?: string };

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
      { name: "Barra IA", href: "/pro/tech-generator", description: "Genera recetas con IA" },
      { name: "Mapa", href: "/mapa", description: "Locales y coctelería" },
      { name: "Pantalla", href: "/pantalla", description: "Series, podcasts y directo" },
    ],
  },
  community: {
    label: "Comunidad",
    links: [
      { name: "Bar Online", href: "/bar-online", description: "Salas en directo" },
      { name: "Comunidad", href: "/comunidad", description: "Foro y conversación" },
    ],
  },
} satisfies Record<string, { label: string; links: NavLinkItem[] }>;
