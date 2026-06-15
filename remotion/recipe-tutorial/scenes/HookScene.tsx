import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { BRAND } from "../theme";

type Props = { title: string; subtext?: string; coverImageUrl?: string };

export const HookScene: React.FC<Props> = ({ title, subtext, coverImageUrl }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 90], [1.08, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const src = coverImageUrl?.startsWith("http")
    ? coverImageUrl
    : coverImageUrl
      ? staticFile(coverImageUrl.startsWith("/") ? coverImageUrl.slice(1) : coverImageUrl)
      : undefined;

  return (
    <AbsoluteFill>
      <BarCartoonBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 48, opacity }}>
        {src ? (
          <Img
            src={src}
            style={{
              width: 520,
              height: 680,
              objectFit: "cover",
              borderRadius: 32,
              transform: `scale(${scale})`,
              boxShadow: `0 24px 64px rgba(0,0,0,0.5)`,
            }}
          />
        ) : null}
        <h1 style={{ color: "#fff", fontSize: 52, marginTop: 32, textAlign: "center" }}>{title}</h1>
        {subtext ? <p style={{ color: BRAND.blue, fontSize: 24, marginTop: 12 }}>{subtext}</p> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
