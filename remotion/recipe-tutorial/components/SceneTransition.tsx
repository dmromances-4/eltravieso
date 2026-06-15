import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

type Props = {
  children: React.ReactNode;
  mode?: "fade" | "cut";
};

export const SceneTransition: React.FC<Props> = ({ children, mode = "fade" }) => {
  const frame = useCurrentFrame();
  const opacity =
    mode === "cut"
      ? 1
      : interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return <div style={{ width: "100%", height: "100%", opacity }}>{children}</div>;
};
