import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { RecipeTutorialProps } from "./RecipeTutorial";
import { BRAND } from "./theme";

function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const relative = url.startsWith("/") ? url.slice(1) : url;
  return staticFile(relative);
}

function Mascot({ pose }: { pose: RecipeTutorialProps["mascotPose"] }) {
  const file = pose ?? "present";
  return (
    <Img
      src={staticFile(`brand/travieso/mascot-${file}.svg`)}
      style={{ width: 280, height: 420, objectFit: "contain" }}
    />
  );
}

function IntroScene({
  title,
  glass,
  mascotPose,
  introTagline,
}: Pick<RecipeTutorialProps, "title" | "glass" | "mascotPose" | "introTagline">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark, justifyContent: "center", alignItems: "center", padding: 48 }}>
      <div style={{ transform: `scale(${scale})`, textAlign: "center", width: "100%" }}>
        <p style={{ color: BRAND.yellow, letterSpacing: 8, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          EL TRAVIESO
        </p>
        <Mascot pose={mascotPose} />
        <h1 style={{ color: "#fff", fontSize: 64, fontWeight: 800, marginTop: 32, lineHeight: 1.1 }}>{title}</h1>
        <p style={{ color: BRAND.blue, fontSize: 28, marginTop: 16 }}>{glass}</p>
        {introTagline ? (
          <p style={{ color: "#888", fontSize: 20, marginTop: 12, maxWidth: 720, marginInline: "auto" }}>
            {introTagline}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

function IngredientsScene({ ingredients }: { ingredients: string[] }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#111", padding: 64 }}>
      <h2 style={{ color: BRAND.yellow, fontSize: 48, marginBottom: 40 }}>Ingredientes</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ingredients.map((item, i) => {
          const opacity = interpolate(frame, [i * 8, i * 8 + 12], [0, 1], { extrapolateRight: "clamp" });
          return (
            <li
              key={i}
              style={{
                opacity,
                color: "#fff",
                fontSize: 32,
                padding: "20px 0",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {item}
            </li>
          );
        })}
      </ul>
    </AbsoluteFill>
  );
}

function StepsScene({ steps }: { steps: string[] }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark, padding: 64 }}>
      <h2 style={{ color: BRAND.blue, fontSize: 48, marginBottom: 40 }}>Preparación</h2>
      {steps.map((step, i) => {
        const opacity = interpolate(frame, [i * 10, i * 10 + 15], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ display: "flex", gap: 20, marginBottom: 28, opacity }}>
            <span
              style={{
                background: BRAND.red,
                color: "#fff",
                width: 44,
                height: 44,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <p style={{ color: "#ddd", fontSize: 28, lineHeight: 1.4, margin: 0 }}>{step}</p>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function OutroScene({ title, coverImageUrl }: Pick<RecipeTutorialProps, "title" | "coverImageUrl">) {
  const coverSrc = resolveAssetUrl(coverImageUrl);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 48,
        textAlign: "center",
      }}
    >
      {coverSrc ? (
        <Img src={coverSrc} style={{ width: 480, height: 600, objectFit: "cover", borderRadius: 32 }} />
      ) : (
        <Mascot pose="present" />
      )}
      <h2 style={{ color: BRAND.yellow, fontSize: 52, marginTop: 40 }}>{title}</h2>
      <p style={{ color: "#888", fontSize: 24, marginTop: 16 }}>Vermut El Travieso · Recetario</p>
    </AbsoluteFill>
  );
}

export const LegacyScenes: React.FC<RecipeTutorialProps> = (props) => {
  const durations = props.sceneDurations ?? {
    intro: 280,
    ingredients: 180,
    steps: 390,
    outro: 210,
  };

  const introFrom = 0;
  const ingredientsFrom = introFrom + durations.intro;
  const stepsFrom = ingredientsFrom + durations.ingredients;
  const outroFrom = stepsFrom + durations.steps;

  return (
    <AbsoluteFill>
      <Sequence from={introFrom} durationInFrames={durations.intro}>
        <IntroScene
          title={props.title}
          glass={props.glass}
          mascotPose={props.mascotPose}
          introTagline={props.introTagline}
        />
      </Sequence>
      <Sequence from={ingredientsFrom} durationInFrames={durations.ingredients}>
        <IngredientsScene ingredients={props.ingredients} />
      </Sequence>
      <Sequence from={stepsFrom} durationInFrames={durations.steps}>
        <StepsScene steps={props.steps.length ? props.steps : ["Preparar y servir bien frío."]} />
      </Sequence>
      <Sequence from={outroFrom} durationInFrames={durations.outro}>
        <OutroScene title={props.title} coverImageUrl={props.coverImageUrl} />
      </Sequence>
    </AbsoluteFill>
  );
};
