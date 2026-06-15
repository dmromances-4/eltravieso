import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AnimatedMascot } from "../components/AnimatedMascot";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { PhysicalGag } from "../components/PhysicalGag";
import { SceneTransition } from "../components/SceneTransition";
import type { CartoonMotionHint, MascotPose } from "../../../lib/recipes/video-prompt";
import { BRAND } from "../theme";

type Props = {
  text?: string;
  stepIndex: number;
  mascotPose?: MascotPose;
  cartoonMotion?: CartoonMotionHint;
};

export const StepBeatScene: React.FC<Props> = ({ text, stepIndex, mascotPose, cartoonMotion }) => {
  const frame = useCurrentFrame();
  const slideX = interpolate(frame, [0, 12], [40, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <BarCartoonBackground />
      <SceneTransition>
        <AbsoluteFill style={{ padding: 56, justifyContent: "space-between" }}>
          <div style={{ opacity, transform: `translateX(${slideX}px)` }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <span
                style={{
                  background: BRAND.red,
                  color: "#fff",
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                {stepIndex}
              </span>
              <p style={{ color: "#eee", fontSize: 30, lineHeight: 1.45, margin: 0, maxWidth: 720 }}>{text}</p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AnimatedMascot pose={mascotPose ?? "present"} motion={cartoonMotion} width={220} height={330} />
          </div>
          <PhysicalGag gag={cartoonMotion?.gag} />
        </AbsoluteFill>
      </SceneTransition>
    </AbsoluteFill>
  );
};
