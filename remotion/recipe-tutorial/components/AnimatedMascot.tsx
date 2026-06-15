import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import type { CartoonMotionHint } from "../../../lib/recipes/video-prompt";
import { anticipationSquash, followThroughOffset } from "../motion/cartoon-timing";

type Pose = "idle" | "stir" | "pour" | "shake" | "present";

type Props = {
  pose?: Pose;
  motion?: CartoonMotionHint;
  width?: number;
  height?: number;
};

export const AnimatedMascot: React.FC<Props> = ({ pose = "present", motion, width = 280, height = 420 }) => {
  const frame = useCurrentFrame();
  const squash = anticipationSquash(frame, motion ?? { anticipationFrames: 10, actionFrames: 14, holdFrames: 8 });
  const bounce =
    pose === "shake"
      ? Math.sin(frame / 3) * 8
      : pose === "stir"
        ? Math.sin(frame / 8) * 4
        : 0;
  const followY = followThroughOffset(frame, (motion?.anticipationFrames ?? 10) + (motion?.actionFrames ?? 14));

  return (
    <div
      style={{
        transform: `translateY(${bounce + followY}px) scaleX(${squash.scaleX}) scaleY(${squash.scaleY})`,
        transformOrigin: "center bottom",
        filter: `drop-shadow(0 12px 24px rgba(0,0,0,0.4))`,
      }}
    >
      <Img
        src={staticFile(`brand/travieso/mascot-${pose}.svg`)}
        style={{ width, height, objectFit: "contain" }}
      />
    </div>
  );
};
