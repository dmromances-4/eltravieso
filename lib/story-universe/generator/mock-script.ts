import type { StoryDraft, StoryScriptPayload } from "../types";

export function buildMockScript(story: StoryDraft): StoryScriptPayload {
  const protagonist = story.characterList[0]?.name ?? "Leo";
  const bartender = story.characterList[1]?.name ?? "Camarero";

  const acts: StoryScriptPayload["screenplay"]["acts"] = [
    {
      act: 1,
      beats: [
        {
          beatNumber: 1,
          heading: "EXT. CALLE — NOCHE",
          action: `Lluvia fina. ${protagonist} observa el neón del bar. El ${story.cocktailReference} pesa como promesa.`,
          dialogue: [{ character: protagonist, line: "Solo una. Luego me largo." }],
          emotion: "tensión contenida",
        },
        {
          beatNumber: 2,
          heading: "INT. BAR — NOCHE",
          action: `${bartender} limpia copas. El local huele a ${story.visualIdentity.mood}.`,
          dialogue: [{ character: bartender, line: "¿Lo de siempre o algo que duela distinto?" }],
          emotion: "humor seco",
        },
      ],
    },
    {
      act: 2,
      beats: Array.from({ length: 8 }, (_, i) => ({
        beatNumber: i + 3,
        heading: `INT. BAR — MESA ${i + 1}`,
        action: `Flashback y confrontación. ${story.conflict.description} La copa simboliza ${story.theme}.`,
        dialogue: [
          { character: protagonist, line: `No vine por consejos, vine por un ${story.cocktailReference}.` },
          { character: bartender, line: "Entonces siéntate y escucha lo que no pediste." },
        ],
        emotion: "melancolía creciente",
      })),
    },
    {
      act: 3,
      beats: [
        {
          beatNumber: 12,
          heading: "INT. BAR — ALBA",
          action: story.resolution.description,
          dialogue: [{ character: protagonist, line: "Gracias por el trago. No por la lección." }],
          emotion: "ironía amarga",
        },
      ],
    },
  ];

  let wordCount = 0;
  for (const act of acts) {
    for (const b of act.beats) {
      wordCount += b.action.split(/\s+/).length;
      for (const d of b.dialogue ?? []) wordCount += d.line.split(/\s+/).length;
    }
  }

  while (wordCount < 1300) {
    acts[1]!.beats.push({
      beatNumber: acts[1]!.beats.length + 3,
      heading: "INT. BAR — CONTINUACIÓN",
      action: `${protagonist} recuerda detalles de ${story.locations[0]?.name ?? "la noche"}. El líquido ${story.visualIdentity.lighting} ilumina su decisión.`,
      dialogue: [{ character: bartender, line: "Cada cóctel es una confesión mal disfrazada." }],
      emotion: "introspección",
    });
    wordCount += 40;
  }

  return {
    synopsis: story.logline,
    treatment: `Tres actos: setup en el bar, complicación emocional con ${story.conflict.type}, cierre ${story.resolution.type}.`,
    screenplay: { acts },
    estimatedRuntimeMins: Math.round(wordCount / 130),
    wordCount,
  };
}
