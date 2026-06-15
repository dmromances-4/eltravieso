import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { VideoBeat } from "../../lib/recipes/video-prompt";
import { LegacyScenes } from "./LegacyScenes";
import { BeatRenderer } from "./scenes/BeatRenderer";

export type RecipeTutorialProps = {
  title: string;
  glass: string;
  ingredients: string[];
  steps: string[];
  coverImageUrl?: string;
  mascotPose?: "idle" | "stir" | "pour" | "shake" | "present";
  introTagline?: string;
  liquidTone?: string;
  garnish?: string;
  totalFrames?: number;
  sceneDurations?: {
    intro: number;
    ingredients: number;
    steps: number;
    outro: number;
  };
  beats?: VideoBeat[];
};

export const RecipeTutorial: React.FC<RecipeTutorialProps> = (props) => {
  if (props.beats?.length) {
    let from = 0;
    let stepIndex = 0;

    return (
      <AbsoluteFill>
        {props.beats.map((beat, i) => {
          const displayStep = beat.kind === "step" ? ++stepIndex : 0;
          const seq = (
            <Sequence key={`${beat.kind}-${i}`} from={from} durationInFrames={beat.durationFrames}>
              <BeatRenderer
                beat={beat}
                ctx={{
                  title: props.title,
                  glass: props.glass,
                  ingredients: props.ingredients,
                  liquidTone: props.liquidTone,
                }}
                stepIndex={displayStep}
              />
            </Sequence>
          );
          from += beat.durationFrames;
          return seq;
        })}
      </AbsoluteFill>
    );
  }

  return <LegacyScenes {...props} />;
};
