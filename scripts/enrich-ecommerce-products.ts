import fs from "fs";
import path from "path";

const PRODUCTS_PATH = path.resolve(process.cwd(), "data", "products.json");

interface Product {
  title: string;
  slug: string;
  description: string | null;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  sourceUrl: string | null;
  format: string;
  volumeMl: number | null;
}

const NEW_PRODUCTS: Product[] = [
  {
    title: "Ginebra Hayman's London Dry",
    slug: "ginebra-hayman-s-london-dry",
    description: "Ginebra clásica estilo London Dry destilada tradicionalmente en Londres con 10 botánicos seleccionados. Destacan sus notas marcadas de enebro, cilantro y cítricos.",
    category: "ALCOHOL",
    priceCents: 1850,
    imageUrl: "https://www.bodeboca.com/sites/default/files/wines/2020-05/bot-haymans-london-dry.jpg",
    sourceUrl: "https://www.bodeboca.com/vino/haymans-london-dry-gin",
    format: "BOTTLE_75CL",
    volumeMl: 700
  },
  {
    title: "Bitter rojo El Travieso",
    slug: "bitter-rojo-el-travieso",
    description: "El bitter rojo insignia de la casa. Infusión artesanal de hierbas alpinas, raíces y cortezas de cítricos, aportando el característico amargor rebelde para el Negroni perfecto.",
    category: "VERMUT",
    priceCents: 1450,
    imageUrl: null,
    sourceUrl: null,
    format: "BOTTLE_75CL",
    volumeMl: 750
  },
  {
    title: "Vermut rojo El Travieso",
    slug: "vermut-rojo-el-travieso",
    description: "Nuestro vermut de grifo macerado con más de 40 botánicos locales. Entrada dulce de canela y regaliz, con final seco y amargo de ajenjo. El alma canalla de la hora del aperitivo.",
    category: "VERMUT",
    priceCents: 1290,
    imageUrl: null,
    sourceUrl: null,
    format: "BOTTLE_75CL",
    volumeMl: 750
  },
  {
    title: "Angostura Bitters",
    slug: "angostura-bitters",
    description: "Bitter aromático concentrado indispensable en cualquier barra del mundo. Elaborado en Trinidad y Tobago desde 1824 según fórmula secreta de hierbas y especias.",
    category: "ALCOHOL",
    priceCents: 1990,
    imageUrl: "https://www.decantalo.com/es/48500-large_default/angostura-bitters.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/angostura-bitters.html",
    format: "UNIT",
    volumeMl: 100
  },
  {
    title: "Angostura Orange Bitters",
    slug: "angostura-orange-bitters",
    description: "La versión cítrica de Angostura. Elaborado con aceites esenciales de naranjas del Caribe, hierbas y especias. Añade una frescura punzante a martinis y clásicos.",
    category: "ALCOHOL",
    priceCents: 1990,
    imageUrl: "https://www.decantalo.com/es/48502-large_default/angostura-orange-bitters.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/angostura-orange-bitters.html",
    format: "UNIT",
    volumeMl: 100
  },
  {
    title: "Ketel One Vodka",
    slug: "ketel-one-vodka",
    description: "Vodka premium de trigo destilado en Holanda. Suave y elegante, con notas sutiles de cítricos y miel, ideal para cócteles como el Espresso Martini.",
    category: "ALCOHOL",
    priceCents: 2100,
    imageUrl: "https://www.decantalo.com/es/37604-large_default/ketel-one-vodka-1l.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/ketel-one-vodka-1l.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Bourbon",
    slug: "bourbon",
    description: "Kentucky Straight Bourbon Whiskey clásico. Envejecido en barricas nuevas de roble carbonizado, ofreciendo notas dulces de vainilla, caramelo y roble especiado.",
    category: "ALCOHOL",
    priceCents: 2350,
    imageUrl: null,
    sourceUrl: null,
    format: "BOTTLE_75CL",
    volumeMl: 700
  },
  {
    title: "Zumo de limón recién exprimido",
    slug: "zumo-de-limon-recien-exprimido",
    description: "Zumo de limón 100% natural y recién exprimido sin azúcares añadidos ni conservantes. Aporta la acidez perfecta y frescura natural a tus combinados y sours.",
    category: "INGREDIENTE",
    priceCents: 290,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Zumo de lima recién exprimido",
    slug: "zumo-de-lima-recien-exprimido",
    description: "Zumo de lima natural y fresco listo para usar. Aporta notas cítricas vibrantes y una acidez refrescante, ideal para mojitos, daiquiris y margaritas.",
    category: "INGREDIENTE",
    priceCents: 350,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Sirope de azúcar rico (2:1)",
    slug: "sirope-de-azucar-rico-2-1",
    description: "Jarabe de azúcar denso de concentración doble (2 partes de azúcar por 1 de agua). Perfecto para endulzar y dar textura sedosa a los tragos sin diluirlos en exceso.",
    category: "SIROPE",
    priceCents: 790,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 750
  },
  {
    title: "Saline solution (20g sea salt to 80g water) or merest pinch of s",
    slug: "saline-solution-20g-sea-salt-to-80g-water-or-merest-pinch-of-s",
    description: "Solución salina en gotas para coctelería. Un ingrediente secreto indispensable que funciona como potenciador de sabores, apagando el amargor e intensificando el dulzor de los cítricos.",
    category: "INGREDIENTE",
    priceCents: 150,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 100
  },
  {
    title: "Kuyper Triple Sec (40%)",
    slug: "kuyper-triple-sec-40",
    description: "Licor de naranja triple sec holandés clásico. Destilado con cortezas de naranja dulce y amarga para un sabor cítrico limpio e indispensable en Margaritas y Cosmopolitans.",
    category: "ALCOHOL",
    priceCents: 1420,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Zumo de naranja recién exprimido",
    slug: "zumo-de-naranja-recien-exprimido",
    description: "Zumo de naranja de mesa 100% exprimido fresco. Aporta dulzor afrutado y vitaminas a tus desayunos o cócteles como el Garibaldi.",
    category: "INGREDIENTE",
    priceCents: 250,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Aromatized wine (e.g. Lillet Blanc)",
    slug: "aromatized-wine-e-g-lillet-blanc",
    description: "Lillet Blanc es un aperitivo clásico francés a base de vino macerado con licores de frutas y quinina. Aporta un perfil floral, dulce y de uva fresca a martinis elegantes.",
    category: "ALCOHOL",
    priceCents: 1690,
    imageUrl: "https://www.decantalo.com/es/39800-large_default/lillet-blanc.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/lillet-blanc.html",
    format: "BOTTLE_75CL",
    volumeMl: 750
  },
  {
    title: "Dubonnet, Byrrh etc. rouge light quinquina",
    slug: "dubonnet-byrrh-etc-rouge-light-quinquina",
    description: "Vino aromatizado quinado clásico estilo Dubonnet Rouge. Mezcla de vinos tintos seleccionados macerados con hierbas, especias y corteza de quina.",
    category: "ALCOHOL",
    priceCents: 1480,
    imageUrl: null,
    sourceUrl: null,
    format: "BOTTLE_75CL",
    volumeMl: 750
  },
  {
    title: "Grenadine/pomegranate syrup",
    slug: "grenadine-pomegranate-syrup",
    description: "Jarabe de granada clásico de color rubí intenso. Dulzor natural con toques cítricos, esencial para colorear y aportar contraste frutal a tragos como el Shirley Temple.",
    category: "SIROPE",
    priceCents: 650,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 750
  },
  {
    title: "Whisky escocés blended",
    slug: "whisky-escoces-blended",
    description: "Whisky escocés de mezcla, equilibrado y suave. Notas de grano dulce, turba ligera y malta, perfecto para Highballs o Penicillin.",
    category: "ALCOHOL",
    priceCents: 1690,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Zumo de piña",
    slug: "zumo-de-pina",
    description: "Zumo de piña natural concentrado para una textura espumosa e idónea en cócteles batidos tropicales como la Piña Colada.",
    category: "INGREDIENTE",
    priceCents: 220,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Patrón Reposado tequila",
    slug: "patron-reposado-tequila",
    description: "Tequila ultra-premium 100% agave azul. Envejecido en barricas de roble americano durante más de dos meses para un toque de madera ligera y miel.",
    category: "ALCOHOL",
    priceCents: 4850,
    imageUrl: "https://www.decantalo.com/es/36551-large_default/patron-reposado-tequila.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/patron-reposado-tequila.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Egg white (pasteurised) or Vegg White vegan egg white alternative",
    slug: "egg-white-pasteurised-or-vegg-white-vegan-egg-white-alternative",
    description: "Clara de huevo líquida pasteurizada. Perfecta para generar la capa de espuma densa y sedosa característica de los cócteles sour clásicos.",
    category: "INGREDIENTE",
    priceCents: 320,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Thomas Henry Agua con gas",
    slug: "thomas-henry-agua-con-gas",
    description: "Agua con gas premium de alta carbonatación e infundida con sales minerales. Diseñada específicamente para no desvanecerse al mezclarse con espirituosos.",
    category: "SODA",
    priceCents: 180,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 200
  },
  {
    title: "Luxardo Maraschino liqueur",
    slug: "luxardo-maraschino-liqueur",
    description: "Original licor de cereza marrasca italiano. De sabor seco, ligeramente herbáceo y con notas almendradas, un modificador imprescindible en clásicos como el Hemingway Daiquiri.",
    category: "ALCOHOL",
    priceCents: 2690,
    imageUrl: "https://www.decantalo.com/es/39561-large_default/luxardo-maraschino.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/luxardo-maraschino.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Aperitivo Luxardo (Aperol-style liqueur)",
    slug: "aperitivo-luxardo-aperol-style-liqueur",
    description: "Licor de aperitivo italiano ligero con infusión de naranjas dulces y amargas, ruibarbo y genciana. De color naranja vibrante y sabor amargo refrescante.",
    category: "ALCOHOL",
    priceCents: 1390,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Kuyper White Crème de Cacao",
    slug: "kuyper-white-creme-de-cacao",
    description: "Licor de cacao blanco holandés dulce y aromático. Aporta notas claras de chocolate blanco y vainilla sin alterar el color del cóctel.",
    category: "ALCOHOL",
    priceCents: 1420,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "La Fée Parisienne absinthe",
    slug: "la-fee-parisienne-absinthe",
    description: "Absenta francesa tradicional elaborada con ajenjo e hinojo. Alta potencia herbal y graduación alcohólica (68%), ideal para enjuagues aromáticos de vasos.",
    category: "ALCOHOL",
    priceCents: 3850,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Cognac (brandy)",
    slug: "cognac-brandy",
    description: "Brandy de solera seleccionado o coñac francés. De carácter cálido y amaderado con notas a uva pasificada, indispensable en Sidecars y Vieux Carrés.",
    category: "ALCOHOL",
    priceCents: 2200,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Peychaud's Bitters",
    slug: "peychaud-s-bitters",
    description: "El genuino bitter de Nueva Orleans creado por Antoine Peychaud en el siglo XIX. Notas marcadas de anís estrellado, clavo y florales, esenciales para el Sazerac.",
    category: "ALCOHOL",
    priceCents: 1890,
    imageUrl: "https://www.decantalo.com/es/48503-large_default/peychaud-s-bitters.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/peychaud-s-bitters.html",
    format: "UNIT",
    volumeMl: 150
  },
  {
    title: "Ferrand Dry Curaçao",
    slug: "ferrand-dry-curacao",
    description: "Triple sec premium elaborado sobre base de coñac por Pierre Ferrand. Menos dulce que otros licores de naranja, aportando una sequedad frutal elegante.",
    category: "ALCOHOL",
    priceCents: 3250,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Havana Club Original Añejo 3 Años Cuban rum",
    slug: "havana-club-original-anejo-3-anos-cuban-rum",
    description: "El clásico ron blanco cubano ideal para Mojitos y Daiquirís. Envejecido 3 años en barricas de roble blanco para notas de vainilla, pera y roble ahumado.",
    category: "ALCOHOL",
    priceCents: 1590,
    imageUrl: "https://www.decantalo.com/es/36021-large_default/havana-club-3-anos.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/havana-club-3-anos.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Cola (e.g. Coca-Cola or Pepsi)",
    slug: "cola-e-g-coca-cola-or-pepsi",
    description: "Refresco de cola de burbuja intensa, ideal para Cuba Libre o combinados clásicos.",
    category: "SODA",
    priceCents: 150,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 330
  },
  {
    title: "Gentian liqueur (e.g. Suze, Salers etc)",
    slug: "gentian-liqueur-e-g-suze-salers-etc",
    description: "Licor de genciana francés clásico de color amarillo brillante. Aporta notas herbáceas, amargas y terrosas muy marcadas y refrescantes.",
    category: "ALCOHOL",
    priceCents: 1950,
    imageUrl: null,
    sourceUrl: null,
    format: "BOTTLE_75CL",
    volumeMl: 700
  },
  {
    title: "Pink Zumo de pomelo recién exprimido",
    slug: "pink-zumo-de-pomelo-recien-exprimido",
    description: "Zumo de pomelo rosa 100% exprimido natural. Perfil amargo y cítrico equilibrado, esencial para la Paloma o el Hemingway Special.",
    category: "INGREDIENTE",
    priceCents: 290,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Adriatico Amaretto Liqueur",
    slug: "adriatico-amaretto-liqueur",
    description: "Licor de almendras premium elaborado con almendras tostadas de Apulia en Italia. Un amaretto moderno de perfil menos dulce y matices salinos.",
    category: "ALCOHOL",
    priceCents: 2990,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Hayman's Old Tom Gin",
    slug: "hayman-s-old-tom-gin",
    description: "Ginebra estilo Old Tom de Hayman's, recreando el estilo ligeramente dulce popular en el siglo XIX. Excelente en Martínez y Tom Collins.",
    category: "ALCOHOL",
    priceCents: 2190,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Rye whiskey 50 % vol.",
    slug: "rye-whiskey-50-vol",
    description: "Rye Whiskey potente (50% ABV) destilado de centeno. Perfil especiado, seco y con carácter, ideal para aportar estructura al Manhattan.",
    category: "ALCOHOL",
    priceCents: 2890,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Heering Cherry Liqueur",
    slug: "heering-cherry-liqueur",
    description: "El licor de cerezas danés por excelencia, elaborado desde 1818 con cerezas maduras y especias. Ingrediente clave del Blood and Sand.",
    category: "ALCOHOL",
    priceCents: 2750,
    imageUrl: "https://www.decantalo.com/es/39556-large_default/cherry-heering.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/cherry-heering.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Green Chartreuse (or alternative herbal liqueur)",
    slug: "green-chartreuse-or-alternative-herbal-liqueur",
    description: "Chartreuse Verde es el elixir monástico de los padres cartujos franceses. Elaborado con 130 plantas con su característico 55% ABV de color natural.",
    category: "ALCOHOL",
    priceCents: 4450,
    imageUrl: "https://www.decantalo.com/es/15421-large_default/chartreuse-verde.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/chartreuse-verde.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Cranberry juice (sweetened)",
    slug: "cranberry-juice-sweetened",
    description: "Zumo de arándanos rojos ligeramente endulzado. Su acidez punzante y color rubí intenso son el pilar del clásico Cosmopolitan.",
    category: "INGREDIENTE",
    priceCents: 280,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 1000
  },
  {
    title: "Elderflower liqueur",
    slug: "elderflower-liqueur",
    description: "Licor de flor de saúco aromático y dulce. Notas florales muy marcadas que añaden un bouquet sofisticado a espumosos y martinis.",
    category: "ALCOHOL",
    priceCents: 2990,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Grand Marnier or other cognac orange liqueur",
    slug: "grand-marnier-or-other-cognac-orange-liqueur",
    description: "Grand Marnier Cordon Rouge combina la finura del coñac francés con licores de naranjas amargas exóticas para un dulzor elegante en coctelería.",
    category: "ALCOHOL",
    priceCents: 3190,
    imageUrl: "https://www.decantalo.com/es/36101-large_default/grand-marnier.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/grand-marnier.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Del Maguey Vida Clásico Mezcal",
    slug: "del-maguey-vida-clasico-mezcal",
    description: "Mezcal artesanal destilado dos veces en alambiques de cobre. Notas marcadas de humo, tierra húmeda, agave dulce y un toque cítrico refrescante.",
    category: "ALCOHOL",
    priceCents: 3990,
    imageUrl: "https://www.decantalo.com/es/39801-large_default/del-maguey-vida.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/del-maguey-vida.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Bénédictine D.O.M. liqueur",
    slug: "benedictine-d-o-m-liqueur",
    description: "Licor de hierbas francés de receta secreta datada del siglo XVI, envejecido en barricas de roble. Ofrece notas de miel, azafrán y cítricos.",
    category: "ALCOHOL",
    priceCents: 3250,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Cynar or other carciofo amaro",
    slug: "cynar-or-other-carciofo-amaro",
    description: "Aperitivo amargo italiano elaborado con una mezcla de hojas de alcachofa y 13 hierbas aromáticas. De final agridulce y cuerpo medio.",
    category: "ALCOHOL",
    priceCents: 1290,
    imageUrl: "https://www.decantalo.com/es/36103-large_default/cynar.jpg",
    sourceUrl: "https://www.decantalo.com/es/es/cynar.html",
    format: "UNIT",
    volumeMl: 700
  },
  {
    title: "Lustau Jarana Fino Sherry",
    slug: "lustau-jarana-fino-sherry",
    description: "Jerez Fino de Lustau. Seco, punzante, almendrado y muy salino en el paladar. La base ideal de los clásicos cócteles de aperitivo estilo Sherry Cobbler.",
    category: "ALCOHOL",
    priceCents: 1150,
    imageUrl: "https://www.bodeboca.com/sites/default/files/wines/2020-05/bot-lustau-jarana-fino.jpg",
    sourceUrl: "https://www.bodeboca.com/vino/lustau-fino-jarana",
    format: "BOTTLE_75CL",
    volumeMl: 750
  },
  {
    title: "Difford's Falernum liqueur",
    slug: "difford-s-falernum-liqueur",
    description: "Licor especiado caribeño (Falernum) de marca seleccionada. Sabores intensos de lima fresca, jengibre picante, clavo aromático y almendras dulces.",
    category: "ALCOHOL",
    priceCents: 1950,
    imageUrl: null,
    sourceUrl: null,
    format: "UNIT",
    volumeMl: 700
  }
];

async function enrich() {
  if (!fs.existsSync(PRODUCTS_PATH)) {
    console.error(`No existe el archivo de productos en: ${PRODUCTS_PATH}`);
    process.exit(1);
  }

  const rawProducts = fs.readFileSync(PRODUCTS_PATH, "utf-8");
  const products: Product[] = JSON.parse(rawProducts);
  const existingSlugs = new Set(products.map(p => p.slug));

  let addedCount = 0;
  for (const newProduct of NEW_PRODUCTS) {
    if (!existingSlugs.has(newProduct.slug)) {
      products.push(newProduct);
      existingSlugs.add(newProduct.slug);
      addedCount++;
      console.log(`  + Añadido: "${newProduct.title}" [slug: ${newProduct.slug}]`);
    }
  }

  if (addedCount > 0) {
    fs.writeFileSync(PRODUCTS_PATH, `${JSON.stringify(products, null, 2)}\n`, "utf-8");
    console.log(`\n✓ Enriquecimiento completado: se añadieron ${addedCount} productos nuevos a data/products.json.`);
  } else {
    console.log("\nNo se añadieron productos nuevos; todos ya existían en el catálogo.");
  }
}

enrich().catch(err => {
  console.error("Error al enriquecer catálogo de productos:", err);
  process.exit(1);
});
