import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedMascot } from "../components/AnimatedMascot";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { CartoonProp } from "../components/CartoonProp";
import { PhysicalGag } from "../components/PhysicalGag";
import { SceneTransition } from "../components/SceneTransition";
import { TechniqueBadge } from "../components/TechniqueBadge";
import type { CartoonMotionHint, MascotPose } from "../../../lib/recipes/video-prompt";

type Props = {
  text?: string;
  mascotPose?: MascotPose;
  cartoonMotion?: CartoonMotionHint;
};

export const TechniqueBeatScene: React.FC<Props> = ({ text, mascotPose, cartoonMotion }) => {
  const gag = cartoonMotion?.gag;
  const showShaker = mascotPose === "shake" || gag === "shaker_pop";

  return (
    <AbsoluteFill>
      <BarCartoonBackground />
      <SceneTransition mode="cut">
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <TechniqueBadge label={text ?? "TÉCNICA"} />
          <div style={{ marginTop: 48 }}>
            <AnimatedMascot pose={mascotPose ?? "stir"} motion={cartoonMotion} />
          </div>
          {showShaker ? <CartoonProp kind="shaker" active /> : <CartoonProp kind="spoon" active />}
          <PhysicalGag gag={gag} />
        </AbsoluteFill>
      </SceneTransition>
    </AbsoluteFill>
  );
};
