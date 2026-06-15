import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRAND } from "../theme";

type Props = { frame?: number };

export const BarCartoonBackground: React.FC<Props> = ({ frame: externalFrame }) => {
  const current = useCurrentFrame();
  const frame = externalFrame ?? current;

  const shelfY = frame * 0.15;
  const barY = frame * 0.08;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: BRAND.dark }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${BRAND.yellow}22, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "55%",
          transform: `translateY(${barY}px)`,
          background: `linear-gradient(180deg, #3d2817 0%, #2a1a0f 100%)`,
          borderTop: `4px solid ${BRAND.yellow}44`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "8%",
          right: "8%",
          height: "35%",
          transform: `translateY(${-shelfY}px)`,
          background: `repeating-linear-gradient(90deg, #4a3020 0px, #4a3020 60px, #3a2518 60px, #3a2518 120px)`,
          borderRadius: 8,
          opacity: 0.85,
          boxShadow: `inset 0 -8px 0 ${BRAND.blue}33`,
        }}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${18 + i * 4}%`,
            left: `${12 + i * 16}%`,
            width: 28,
            height: 64,
            borderRadius: 4,
            backgroundColor: i % 2 === 0 ? BRAND.red : BRAND.blue,
            opacity: 0.5,
            transform: `translateY(${-shelfY * 0.5}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
