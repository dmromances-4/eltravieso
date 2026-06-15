import React from "react";
import type { VideoBeat } from "../../../lib/recipes/video-prompt";
import { BrandStingScene } from "./BrandStingScene";
import { HookScene } from "./HookScene";
import { IngredientsBeatScene } from "./IngredientsBeatScene";
import { OutroScene } from "./OutroScene";
import { RevealScene } from "./RevealScene";
import { SpecCardScene } from "./SpecCardScene";
import { StepBeatScene } from "./StepBeatScene";
import { TechniqueBeatScene } from "./TechniqueBeatScene";

export type BeatRendererContext = {
  title: string;
  glass: string;
  ingredients: string[];
  liquidTone?: string;
};

type Props = {
  beat: VideoBeat;
  ctx: BeatRendererContext;
  stepIndex: number;
};

export const BeatRenderer: React.FC<Props> = ({ beat, ctx, stepIndex }) => {
  switch (beat.kind) {
    case "hook":
      return (
        <HookScene title={beat.text ?? ctx.title} subtext={beat.subtext ?? ctx.glass} coverImageUrl={beat.coverImageUrl} />
      );
    case "brand_sting":
      return (
        <BrandStingScene
          text={beat.text}
          subtext={beat.subtext}
          mascotPose={beat.mascotPose}
          cartoonMotion={beat.cartoonMotion}
        />
      );
    case "spec_card":
      return <SpecCardScene title={beat.text ?? ctx.title} subtext={beat.subtext} liquidTone={ctx.liquidTone} />;
    case "ingredients":
      return (
        <IngredientsBeatScene
          ingredients={ctx.ingredients}
          parsed={beat.ingredients}
          overflow={beat.ingredientsOverflow}
          subtext={beat.subtext}
        />
      );
    case "technique":
      return (
        <TechniqueBeatScene text={beat.text} mascotPose={beat.mascotPose} cartoonMotion={beat.cartoonMotion} />
      );
    case "step":
      return (
        <StepBeatScene
          text={beat.text}
          stepIndex={stepIndex}
          mascotPose={beat.mascotPose}
          cartoonMotion={beat.cartoonMotion}
        />
      );
    case "reveal":
      return (
        <RevealScene title={beat.text ?? ctx.title} subtext={beat.subtext} coverImageUrl={beat.coverImageUrl} />
      );
    case "outro":
      return <OutroScene title={beat.text ?? ctx.title} subtext={beat.subtext} />;
    default:
      return null;
  }
};
