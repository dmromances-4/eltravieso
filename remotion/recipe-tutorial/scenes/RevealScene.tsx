import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { SceneTransition } from "../components/SceneTransition";
import { BRAND } from "../theme";

type Props = { title: string; subtext?: string; coverImageUrl?: string };

export const RevealScene: React.FC<Props> = ({ title, subtext, coverImageUrl }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 20, 60], [0.85, 1.05, 1], { extrapolateRight: "clamp" });
  const src = coverImageUrl?.startsWith("http")
    ? coverImageUrl
    : coverImageUrl
      ? staticFile(coverImageUrl.startsWith("/") ? coverImageUrl.slice(1) : coverImageUrl)
      : undefined;

  return (
    <AbsoluteFill>
      <BarCartoonBackground />
      <SceneTransition>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 48, textAlign: "center" }}>
          {src ? (
            <Img
              src={src}
              style={{
                width: 500,
                height: 620,
                objectFit: "cover",
                borderRadius: 28,
                transform: `scale(${scale})`,
                border: `4px solid ${BRAND.yellow}`,
              }}
            />
          ) : null}
          <h2 style={{ color: BRAND.yellow, fontSize: 48, marginTop: 36 }}>{title}</h2>
          {subtext ? <p style={{ color: "#aaa", fontSize: 24, marginTop: 12 }}>{subtext}</p> : null}
        </AbsoluteFill>
      </SceneTransition>
    </AbsoluteFill>
  );
};
