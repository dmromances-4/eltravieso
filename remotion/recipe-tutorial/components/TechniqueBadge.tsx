import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../theme";

type Props = { label: string };

export const TechniqueBadge: React.FC<Props> = ({ label }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 8, 14], [0.6, 1.2, 1], { extrapolateRight: "clamp" });
  const flash = interpolate(frame, [0, 4, 10], [0, 0.35, 0], { extrapolateRight: "clamp" });

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: BRAND.yellow,
          opacity: flash,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          transform: `scale(${scale})`,
          backgroundColor: BRAND.red,
          color: "#fff",
          padding: "16px 32px",
          borderRadius: 12,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: 4,
          border: `3px solid ${BRAND.yellow}`,
        }}
      >
        {label}
      </div>
    </>
  );
};
