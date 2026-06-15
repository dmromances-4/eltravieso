import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { SceneTransition } from "../components/SceneTransition";
import type { ParsedIngredient } from "../../../lib/recipes/video-prompt";
import { BRAND } from "../theme";

type Props = {
  ingredients: string[];
  parsed?: ParsedIngredient[];
  overflow?: number;
  subtext?: string;
};

export const IngredientsBeatScene: React.FC<Props> = ({ ingredients, parsed, overflow, subtext }) => {
  const frame = useCurrentFrame();
  const items = parsed?.length
    ? parsed.map((p) => (p.amount ? `${p.amount} ${p.name}` : p.name))
    : ingredients;

  return (
    <AbsoluteFill>
      <BarCartoonBackground />
      <SceneTransition>
        <AbsoluteFill style={{ padding: 64 }}>
          <h2 style={{ color: BRAND.yellow, fontSize: 48, marginBottom: 32 }}>Ingredientes</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((item, i) => {
              const opacity = interpolate(frame, [i * 10, i * 10 + 14], [0, 1], {
                extrapolateRight: "clamp",
              });
              const highlight = parsed?.[i]?.highlight;
              return (
                <li
                  key={i}
                  style={{
                    opacity,
                    color: highlight ? BRAND.yellow : "#fff",
                    fontSize: 30,
                    padding: "18px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    fontWeight: highlight ? 700 : 400,
                  }}
                >
                  {item}
                </li>
              );
            })}
          </ul>
          {overflow && overflow > 0 ? (
            <p style={{ color: "#666", fontSize: 22, marginTop: 16 }}>+{overflow} más</p>
          ) : null}
          {subtext ? <p style={{ color: BRAND.blue, fontSize: 22, marginTop: 32 }}>{subtext}</p> : null}
        </AbsoluteFill>
      </SceneTransition>
    </AbsoluteFill>
  );
};
