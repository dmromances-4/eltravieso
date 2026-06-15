import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../theme";

type Gag = "shaker_pop" | "splash" | "stumble" | "double_take";

type Props = { gag?: Gag | null };

export const PhysicalGag: React.FC<Props> = ({ gag }) => {
  const frame = useCurrentFrame();
  if (!gag) return null;

  if (gag === "shaker_pop") {
    const scale = interpolate(frame, [0, 6, 14], [0.4, 1.4, 1], { extrapolateRight: "clamp" });
    const opacity = interpolate(frame, [0, 4, 20], [0, 1, 0], { extrapolateRight: "clamp" });
    return (
      <div
        style={{
          position: "absolute",
          top: "28%",
          right: "18%",
          fontSize: 72,
          fontWeight: 900,
          color: BRAND.yellow,
          transform: `scale(${scale}) rotate(-8deg)`,
          opacity,
          textShadow: "4px 4px 0 #000",
        }}
      >
        POP!
      </div>
    );
  }

  if (gag === "splash") {
    const spread = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
    return (
      <AbsoluteFillGag>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${35 + i * 3}%`,
              left: `${40 + i * 5}%`,
              width: 24 + i * 8,
              height: 24 + i * 8,
              borderRadius: "50% 50% 40% 60%",
              backgroundColor: BRAND.blue,
              opacity: (1 - spread * 0.3) * 0.7,
              transform: `scale(${0.5 + spread * (1 + i * 0.2)})`,
            }}
          />
        ))}
      </AbsoluteFillGag>
    );
  }

  if (gag === "stumble") {
    const tilt = interpolate(frame, [0, 8, 16], [0, -12, 4], { extrapolateRight: "clamp" });
    return (
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          left: "50%",
          fontSize: 48,
          transform: `translateX(-50%) rotate(${tilt}deg)`,
          color: BRAND.red,
        }}
      >
        !!!
      </div>
    );
  }

  if (gag === "double_take") {
    const pop = interpolate(frame, [0, 4, 8], [1, 1.25, 1], { extrapolateRight: "clamp" });
    return (
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: `translateX(-50%) scale(${pop})`,
          fontSize: 56,
        }}
      >
        ?!
      </div>
    );
  }

  return null;
};

function AbsoluteFillGag({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{children}</div>;
}
