import React from "react";
import { Composition } from "remotion";
import { StoryEpisode, type StoryEpisodeProps } from "./StoryEpisode";

const defaultProps: StoryEpisodeProps = {
  title: "Historia piloto",
  logline: "Un cóctel como última confesión en un bar de neón.",
  totalFrames: 1800,
  scenes: [
    { sceneNumber: 1, description: "Entrada al bar. Lluvia y neón amarillo.", durationFrames: 450, camera: "plano general" },
    { sceneNumber: 2, description: "El protagonista pide un trago que sabe a recuerdo.", durationFrames: 450, camera: "primer plano" },
    { sceneNumber: 3, description: "Cierre irónico. La copa queda vacía.", durationFrames: 450, camera: "detalle copa" },
  ],
};

export const StoryEpisodeRoot: React.FC = () => {
  return (
    <Composition
      id="StoryEpisode"
      component={StoryEpisode}
      durationInFrames={defaultProps.totalFrames}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => ({
        durationInFrames: props.totalFrames ?? defaultProps.totalFrames,
      })}
    />
  );
};
