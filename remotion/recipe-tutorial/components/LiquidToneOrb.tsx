import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../theme";

type Props = { tone?: string };

export const LiquidToneOrb: React.FC<Props> = ({ tone }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 10) * 0.08;
  const glow = interpolate(frame, [0, 30], [0.4, 0.7], { extrapolateRight: "extend" });

  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${BRAND.yellow}, ${BRAND.red} 55%, ${BRAND.blue})`,
        transform: `scale(${pulse})`,
        boxShadow: `0 0 ${40 * glow}px ${BRAND.red}88`,
        margin: "0 auto 24px",
      }}
      title={tone}
    />
  );
};
