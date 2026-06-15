import React from "react";
import { AbsoluteFill } from "remotion";
import { BarCartoonBackground } from "../components/BarCartoonBackground";
import { LiquidToneOrb } from "../components/LiquidToneOrb";
import { SceneTransition } from "../components/SceneTransition";
import { BRAND } from "../theme";

type Props = { title: string; subtext?: string; liquidTone?: string };

export const SpecCardScene: React.FC<Props> = ({ title, subtext, liquidTone }) => (
  <AbsoluteFill>
    <BarCartoonBackground />
    <SceneTransition>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 64, textAlign: "center" }}>
        <LiquidToneOrb tone={liquidTone} />
        <h1 style={{ color: "#fff", fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>{title}</h1>
        {subtext ? <p style={{ color: BRAND.blue, fontSize: 26, marginTop: 20, maxWidth: 800 }}>{subtext}</p> : null}
      </AbsoluteFill>
    </SceneTransition>
  </AbsoluteFill>
);
