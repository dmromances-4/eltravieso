import React from "react";
import { Composition } from "remotion";
import { RecipeTutorial, type RecipeTutorialProps } from "./RecipeTutorial";

const defaultProps: RecipeTutorialProps = {
  title: "Sweet Martini",
  glass: "Copa martini",
  ingredients: ["75 ml Gin", "15 ml Vermut rojo"],
  steps: ["Enfriar la copa", "Mezclar con hielo", "Colar y servir"],
  coverImageUrl: undefined,
  mascotPose: "stir",
  totalFrames: 1060,
  sceneDurations: { intro: 280, ingredients: 180, steps: 390, outro: 210 },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RecipeTutorial"
        component={RecipeTutorial}
        durationInFrames={defaultProps.totalFrames ?? 900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: props.totalFrames ?? defaultProps.totalFrames ?? 900,
        })}
      />
    </>
  );
};
