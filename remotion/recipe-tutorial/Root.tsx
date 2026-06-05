import React from "react";
import { Composition } from "remotion";
import { RecipeTutorial, type RecipeTutorialProps } from "./RecipeTutorial";

export const RemotionRoot: React.FC = () => {
  const defaultProps: RecipeTutorialProps = {
    title: "Sweet Martini",
    glass: "Copa martini",
    ingredients: ["75 ml Gin", "15 ml Vermut rojo"],
    steps: ["Enfriar la copa", "Mezclar con hielo", "Colar y servir"],
    coverImageUrl: undefined,
    mascotPose: "stir",
  };

  return (
    <>
      <Composition
        id="RecipeTutorial"
        component={RecipeTutorial}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};
