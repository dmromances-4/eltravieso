import { describe, expect, it } from "vitest";
import {
  discoverProductUrlsFromHtml,
  mergeSpiritCatalog,
  parsePriceCents,
  parseSpiritFromHtml,
  parseVolumeMl,
  SPIRITS_RETAILERS,
} from "@/lib/products/spirits-import";

const VV_GIN_HTML = `
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":2,"item":{"name":"Destilados"}},{"@type":"ListItem","position":4,"item":{"name":"Ginebra"}}]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Brockmans London Dry Gin","description":"Botella de 70cl de Brockmans London Dry Gin.","image":"https://www.vilaviniteca.es/media/v029643.jpg","offers":[{"@type":"Offer","price":26.8,"priceCurrency":"EUR"}],"brand":{"@type":"Brand","name":"Brockmans"},"nxt_formato_botella":"70 cl","nxt_denominacion_origen":" Inglaterra","sku":"029643"}</script>
<a href="https://www.vilaviniteca.es/es/brockmans-london-dry-gin.html">Gin</a>
`;

const LF_GIN_HTML = `
<script type="application/ld+json">{"@context":"https://schema.org/","@graph":[{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":3,"item":{"name":"DESTILADOS","@id":"https://lafuente.es/cat-prod/destilados/"}},{"@type":"ListItem","position":4,"item":{"name":"GINEBRA","@id":"https://lafuente.es/cat-prod/destilados/ginebra/"}},{"@type":"ListItem","position":5,"item":{"name":"Gin Nº209 1l","@id":"https://lafuente.es/tienda/gin-no209-1l/"}}]},{"@type":"Product","name":"Gin Nº209 1l","description":"La destilería fue fundada en 1882 en San Francisco.","image":"//www.lafuente.es/wp-content/uploads/4894.jpg","sku":"90065","offers":[{"@type":"Offer","priceSpecification":[{"@type":"UnitPriceSpecification","price":"40.95","priceCurrency":"EUR"}]}]}]}</script>
<a href="https://lafuente.es/tienda/gin-no209-1l/">Gin</a>
`;

describe("spirits-import parsers", () => {
  it("parsePriceCents handles EU formats", () => {
    expect(parsePriceCents("26,80 €")).toBe(2680);
    expect(parsePriceCents(40.95)).toBe(4095);
  });

  it("parseVolumeMl extracts cl and ml", () => {
    expect(parseVolumeMl("70 cl")).toBe(700);
    expect(parseVolumeMl("1 L")).toBe(1000);
  });

  it("parseSpiritFromHtml extracts Vilaviniteca product", () => {
    const p = parseSpiritFromHtml(VV_GIN_HTML, "https://www.vilaviniteca.es/es/brockmans-london-dry-gin.html", SPIRITS_RETAILERS.vilaviniteca);
    expect(p?.title).toBe("Brockmans London Dry Gin");
    expect(p?.priceCents).toBe(2680);
    expect(p?.volumeMl).toBe(700);
    expect(p?.metadata?.brand).toBe("Brockmans");
    expect(p?.metadata?.spiritType).toBe("ginebra");
  });

  it("parseSpiritFromHtml extracts Lafuente product with history", () => {
    const p = parseSpiritFromHtml(LF_GIN_HTML, "https://lafuente.es/tienda/gin-no209-1l/", SPIRITS_RETAILERS.lafuente);
    expect(p?.title).toBe("Gin Nº209 1l");
    expect(p?.priceCents).toBe(4095);
    expect(p?.imageUrl).toMatch(/^https:\/\/www\.lafuente\.es/);
    expect(p?.metadata?.history ?? p?.description).toMatch(/1882/);
  });

  it("discoverProductUrlsFromHtml finds product links", () => {
    const urls = discoverProductUrlsFromHtml(
      VV_GIN_HTML,
      "https://www.vilaviniteca.es/es/destilados/tipo/ginebra.html",
      SPIRITS_RETAILERS.vilaviniteca
    );
    expect(urls).toContain("https://www.vilaviniteca.es/es/brockmans-london-dry-gin.html");
  });

  it("mergeSpiritCatalog deduplicates by slug and keeps richer data", () => {
    const a = [{ title: "Gin A", slug: "gin-a", description: null, category: "ALCOHOL", priceCents: 0, imageUrl: null, sourceUrl: null, format: "UNIT", volumeMl: null }];
    const b = [{ title: "Gin A", slug: "gin-a", description: "Historia larga", category: "ALCOHOL", priceCents: 2500, imageUrl: "https://x/img.jpg", sourceUrl: "https://x", format: "UNIT", volumeMl: 700, metadata: { retailer: "lafuente", referencePriceCents: 2500 } }];
    const { merged, added } = mergeSpiritCatalog(a, b);
    expect(added).toBe(0);
    expect(merged[0].priceCents).toBe(2500);
    expect(merged[0].description).toBe("Historia larga");
  });
});
