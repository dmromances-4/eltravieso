import React from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, surfaceColors } from "../../lib/theme/tokens";

export type StoryEpisodeScene = {
  sceneNumber: number;
  description: string;
  durationFrames: number;
  camera?: string;
  lighting?: string;
};

export type StoryEpisodeProps = {
  title: string;
  logline: string;
  scenes: StoryEpisodeScene[];
  totalFrames: number;
  fps?: number;
};

const BRAND = {
  blue: brandColors.blue,
  yellow: brandColors.yellow,
  red: brandColors.red,
  dark: surfaceColors.night,
};

function SceneCard({ description, camera }: { description: string; camera?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 56,
        opacity,
      }}
    >
      <p style={{ color: BRAND.yellow, letterSpacing: 6, fontSize: 20, fontWeight: 700 }}>EL TRAVIESO UNIVERSE</p>
      <p style={{ color: "#fff", fontSize: 36, textAlign: "center", marginTop: 32, lineHeight: 1.35, maxWidth: 900 }}>
        {description}
      </p>
      {camera ? (
        <p style={{ color: BRAND.blue, fontSize: 22, marginTop: 24 }}>{camera}</p>
      ) : null}
    </AbsoluteFill>
  );
}

export const StoryEpisode: React.FC<StoryEpisodeProps> = ({ title, logline, scenes }) => {
  let offset = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark }}>
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill style={{ backgroundColor: BRAND.dark, justifyContent: "center", alignItems: "center", padding: 48 }}>
          <h1 style={{ color: "#fff", fontSize: 52, textAlign: "center" }}>{title}</h1>
          <p style={{ color: "#aaa", fontSize: 24, marginTop: 24, textAlign: "center", maxWidth: 800 }}>{logline}</p>
        </AbsoluteFill>
      </Sequence>
      {(() => {
        offset = 90;
        return scenes.map((scene) => {
          const from = offset;
          offset += scene.durationFrames;
          return (
            <Sequence key={scene.sceneNumber} from={from} durationInFrames={scene.durationFrames}>
              <SceneCard description={scene.description} camera={scene.camera} />
            </Sequence>
          );
        });
      })()}
    </AbsoluteFill>
  );
};

export function storyboardToEpisodeProps(input: {
  title: string;
  logline: string;
  scenes: Array<{ sceneNumber: number; description: string; durationSecs: number; camera: string; lighting: string }>;
  fps?: number;
}): StoryEpisodeProps {
  const fps = input.fps ?? 30;
  const scenes: StoryEpisodeScene[] = input.scenes.map((s) => ({
    sceneNumber: s.sceneNumber,
    description: s.description,
    durationFrames: Math.max(30, Math.round(s.durationSecs * fps)),
    camera: s.camera,
    lighting: s.lighting,
  }));
  const totalFrames = 90 + scenes.reduce((sum, s) => sum + s.durationFrames, 0);
  return { title: input.title, logline: input.logline, scenes, totalFrames, fps };
}
