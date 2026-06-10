import { describe, expect, it } from "vitest";

import { brandColors, brandRadii, brandShadows, brandTypography, surfaceColors } from "@/lib/theme/tokens";

import tailwindConfig from "../tailwind.config";



describe("brand theme tokens", () => {

  it("defines official palette", () => {

    expect(brandColors.yellow).toBe("#F9D142");

    expect(brandColors.blue).toBe("#2B87B9");

    expect(brandColors.red).toBe("#A62125");

  });



  it("maps electric colors in tailwind config", () => {

    const colors = tailwindConfig.theme?.extend?.colors as Record<string, unknown>;

    const electric = colors.electric as Record<string, string>;

    expect(electric.yellow).toBe(brandColors.yellow);

    expect(electric.blue).toBe(brandColors.blue);

    expect(electric.red).toBe(brandColors.red);

  });



  it("defines dark surfaces", () => {

    expect(surfaceColors.night).toBe("#0F0F0F");

    expect(surfaceColors.panel).toBe("#111111");

  });



  it("defines editorial radii and typography tokens", () => {

    expect(brandRadii.card).toBe("1rem");

    expect(brandRadii.pill).toBe("9999px");

    expect(brandTypography.display).toBe("var(--font-display)");

    expect(brandTypography.body).toBe("var(--font-sans)");

  });



  it("defines subtle shadows without neon as primary", () => {

    expect(brandShadows.card).toContain("rgba(0,0,0");

    expect(brandShadows.subtle).toBeTruthy();

  });

});

