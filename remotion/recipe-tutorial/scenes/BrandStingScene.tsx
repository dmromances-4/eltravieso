import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedMascot } from "../components/AnimatedMascot";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { SceneTransition } from "../components/SceneTransition";
import type { CartoonMotionHint, MascotPose } from "../../../lib/recipes/video-prompt";
import { BRAND } from "../theme";

type Props = {
  text?: string;
  subtext?: string;
  mascotPose?: MascotPose;
  cartoonMotion?: CartoonMotionHint;
};

export const BrandStingScene: React.FC<Props> = ({ text, subtext, mascotPose, cartoonMotion }) => (
  <AbsoluteFill>
    <BarCartoonBackground />
    <SceneTransition>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 48, textAlign: "center" }}>
        <p style={{ color: BRAND.yellow, letterSpacing: 8, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          {text ?? "EL TRAVIESO"}
        </p>
        <AnimatedMascot pose={mascotPose ?? "present"} motion={cartoonMotion} />
        {subtext ? (
          <p style={{ color: "#888", fontSize: 20, marginTop: 24, maxWidth: 720 }}>{subtext}</p>
        ) : null}
      </AbsoluteFill>
    </SceneTransition>
  </AbsoluteFill>
);
