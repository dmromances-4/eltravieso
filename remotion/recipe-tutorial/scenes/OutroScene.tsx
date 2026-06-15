import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedMascot } from "../components/AnimatedMascot";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { SceneTransition } from "../components/SceneTransition";
import { snappyEntrance } from "../motion/cartoon-timing";
import { BRAND } from "../theme";

type Props = { title: string; subtext?: string };

export const OutroScene: React.FC<Props> = ({ title, subtext }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bounce = snappyEntrance(frame, fps);
  const ctaPulse = 1 + Math.sin(frame / 8) * 0.04;

  return (
    <AbsoluteFill>
      <BarCartoonBackground />
      <SceneTransition>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 48,
            textAlign: "center",
            transform: `scale(${bounce})`,
          }}
        >
          <AnimatedMascot pose="present" width={240} height={360} />
          <h2 style={{ color: BRAND.yellow, fontSize: 52, marginTop: 32 }}>{title}</h2>
          <p style={{ color: "#888", fontSize: 24, marginTop: 16, transform: `scale(${ctaPulse})` }}>
            {subtext ?? "Vermut El Travieso · Recetario"}
          </p>
        </AbsoluteFill>
      </SceneTransition>
    </AbsoluteFill>
  );
};
