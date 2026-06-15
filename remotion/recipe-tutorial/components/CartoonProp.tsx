import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../theme";

type PropKind = "shaker" | "spoon";

type Props = { kind: PropKind; active?: boolean };

export const CartoonProp: React.FC<Props> = ({ kind, active }) => {
  const frame = useCurrentFrame();
  const swing = active ? Math.sin(frame / 4) * 18 : 0;
  const follow = active ? interpolate(frame % 20, [14, 20], [0, 8], { extrapolateRight: "clamp" }) : 0;

  if (kind === "shaker") {
    return (
      <div
        style={{
          position: "absolute",
          right: "12%",
          bottom: "32%",
          width: 64,
          height: 120,
          transform: `rotate(${swing + follow}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "70%",
            backgroundColor: "#ccc",
            borderRadius: "8px 8px 4px 4px",
            border: `3px solid ${BRAND.dark}`,
          }}
        />
        <div
          style={{
            width: "80%",
            height: "25%",
            margin: "0 auto",
            backgroundColor: BRAND.blue,
            borderRadius: 4,
            border: `2px solid ${BRAND.dark}`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "20%",
        bottom: "38%",
        width: 100,
        height: 8,
        backgroundColor: BRAND.yellow,
        borderRadius: 4,
        transform: `rotate(${-15 + swing * 0.3}deg)`,
        transformOrigin: "left center",
      }}
    />
  );
};
