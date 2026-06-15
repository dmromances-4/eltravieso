import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { loadRawExtractions } from "../corpus/run-ingest";
import { appendStoryUniverseChangelog } from "../changelog";
import { KNOWLEDGE_BASE_DIR } from "../paths";
import type {
  ArchetypeEntry,
  CharacterPatterns,
  ChunkExtraction,
  ConflictEntry,
  DialoguePatternEntry,
  EmotionEntry,
  KnowledgeRelations,
  LocationEntry,
  NarrativePatternEntry,
  RelationshipEntry,
  SymbolEntry,
  ThemeEntry,
  VisualPatternEntry,
} from "../types";
import { aggregateLabels, weightFromCount } from "./normalize";
import { slugifyId } from "../slugify";

function inferValence(emotion: string): EmotionEntry["valence"] {
  const e = emotion.toLowerCase();
  if (/melancol|triste|soledad|vacío|miedo|ira/.test(e)) return "negative";
  if (/alegr|esperanza|amor|calidez/.test(e)) return "positive";
  if (/cínico|humor|ironía|mix/.test(e)) return "mixed";
  return "neutral";
}

export async function buildKnowledgeBaseFromExtractions(
  extractions: Array<{ extraction: ChunkExtraction }>,
): Promise<void> {
  await mkdir(KNOWLEDGE_BASE_DIR, { recursive: true });

  const list = extractions.map((e) => e.extraction);
  if (list.length === 0) {
    await seedMinimalKnowledgeBase();
    return;
  }

  const themeAgg = aggregateLabels(list, (e) => e.themes);
  const maxTheme = themeAgg[0]?.count ?? 1;
  const themes: ThemeEntry[] = themeAgg.map((t) => ({
    id: t.id || slugifyId(t.label),
    label: t.label,
    weight: weightFromCount(t.count, maxTheme),
    sourceChunks: t.sourceChunks,
    subthemes: [],
  }));

  for (const ext of list) {
    for (const sub of ext.subthemes) {
      const theme = themes.find((th) => ext.themes.some((t) => slugifyId(t) === th.id || t === th.label));
      if (theme && !theme.subthemes.includes(sub)) theme.subthemes.push(sub);
    }
  }

  const emotionAgg = aggregateLabels(list, (e) => e.emotions);
  const maxEmo = emotionAgg[0]?.count ?? 1;
  const emotions: EmotionEntry[] = emotionAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxEmo),
    sourceChunks: t.sourceChunks,
    valence: inferValence(t.label),
    intensity: Math.min(1, t.count / maxEmo),
    pairedThemes: [],
  }));

  const archetypeAgg = aggregateLabels(list, (e) => e.archetypes);
  const maxArch = archetypeAgg[0]?.count ?? 1;
  const archetypes: ArchetypeEntry[] = archetypeAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxArch),
    sourceChunks: t.sourceChunks,
    traits: [],
    typicalConflicts: [],
    visualCues: [],
  }));

  const conflictAgg = aggregateLabels(list, (e) => e.conflicts);
  const maxConf = conflictAgg[0]?.count ?? 1;
  const conflicts: ConflictEntry[] = conflictAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxConf),
    sourceChunks: t.sourceChunks,
    type: t.label,
    stakes: "identidad y supervivencia emocional",
    resolutionPatterns: ["aceptación amarga", "fuga", "pequeño gesto de dignidad"],
  }));

  const locationAgg = aggregateLabels(list, (e) => e.scenarios);
  const maxLoc = locationAgg[0]?.count ?? 1;
  const locations: LocationEntry[] = locationAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxLoc),
    sourceChunks: t.sourceChunks,
    atmosphere: "nocturna y humilde",
    timeOfDay: "noche",
    sensoryTags: ["humo", "neón", "madera húmeda"],
  }));

  const symbolAgg = aggregateLabels(list, (e) => [...e.symbols, ...e.recurringObjects]);
  const maxSym = symbolAgg[0]?.count ?? 1;
  const symbols: SymbolEntry[] = symbolAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxSym),
    sourceChunks: t.sourceChunks,
    meaning: "memoria, deseo o decadencia",
    recurrenceWeight: weightFromCount(t.count, maxSym),
  }));

  const relAgg = aggregateLabels(list, (e) => e.relationships);
  const maxRel = relAgg[0]?.count ?? 1;
  const relationships: RelationshipEntry[] = relAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxRel),
    sourceChunks: t.sourceChunks,
    dynamic: t.label,
    tensionCurve: "ascendente con caída abrupta",
  }));

  const charPatterns: CharacterPatterns = {
    motivations: aggregateLabels(list, (e) => e.motivations).map((t) => ({
      id: t.id,
      label: t.label,
      weight: weightFromCount(t.count, maxTheme),
      sourceChunks: t.sourceChunks,
      examples: [],
    })),
    failures: aggregateLabels(list, (e) => e.failures).map((t) => ({
      id: t.id,
      label: t.label,
      weight: weightFromCount(t.count, maxTheme),
      sourceChunks: t.sourceChunks,
      examples: [],
    })),
    desires: aggregateLabels(list, (e) => e.desires).map((t) => ({
      id: t.id,
      label: t.label,
      weight: weightFromCount(t.count, maxTheme),
      sourceChunks: t.sourceChunks,
      examples: [],
    })),
    obsessions: aggregateLabels(list, (e) => e.obsessions).map((t) => ({
      id: t.id,
      label: t.label,
      weight: weightFromCount(t.count, maxTheme),
      sourceChunks: t.sourceChunks,
      examples: [],
    })),
  };

  const narrativeAgg = aggregateLabels(list, (e) => [...e.narrativeStructures, ...e.narrativeRhythms]);
  const maxNar = narrativeAgg[0]?.count ?? 1;
  const narrativePatterns: NarrativePatternEntry[] = narrativeAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxNar),
    sourceChunks: t.sourceChunks,
    structure: t.label,
    pacing: "variable con pausas",
    endingTypes: list.flatMap((e) => e.endingTypes).slice(0, 5),
  }));

  const visualPatterns: VisualPatternEntry[] = [
    {
      id: "noir_bar",
      label: "Bar noir urbano",
      weight: 1,
      sourceChunks: [],
      palette: ["#1a1a1a", "#F9D142", "#2B87B9", "#A62125"],
      lighting: "neón y contraluz cálida",
      cameraTendencies: ["plano medio", "primer plano reacción", "travelling lento"],
    },
  ];

  const dialogueAgg = aggregateLabels(list, (e) => e.dialoguePatterns);
  const maxDial = dialogueAgg[0]?.count ?? 1;
  const dialoguePatterns: DialoguePatternEntry[] = dialogueAgg.map((t) => ({
    id: t.id,
    label: t.label,
    weight: weightFromCount(t.count, maxDial),
    sourceChunks: t.sourceChunks,
    register: "coloquial seco",
    rhythm: "frases cortas",
    subtextLevel: "high",
  }));

  const relations: KnowledgeRelations = {
    themeToEmotion: themes.slice(0, 10).flatMap((theme, i) =>
      emotions.slice(i, i + 2).map((emo) => ({
        themeId: theme.id,
        emotionId: emo.id,
        weight: 0.5,
      })),
    ),
    themeToConflict: themes.slice(0, 8).map((theme, i) => ({
      themeId: theme.id,
      conflictId: conflicts[i % conflicts.length]?.id ?? conflicts[0]!.id,
      weight: 0.6,
    })),
    archetypeToTheme: archetypes.slice(0, 8).map((arch, i) => ({
      archetypeId: arch.id,
      themeId: themes[i % themes.length]?.id ?? themes[0]!.id,
      weight: 0.7,
    })),
  };

  await writeJson("themes.json", { generatedAt: new Date().toISOString(), items: themes });
  await writeJson("emotions.json", { generatedAt: new Date().toISOString(), items: emotions });
  await writeJson("archetypes.json", { generatedAt: new Date().toISOString(), items: archetypes });
  await writeJson("conflicts.json", { generatedAt: new Date().toISOString(), items: conflicts });
  await writeJson("locations.json", { generatedAt: new Date().toISOString(), items: locations });
  await writeJson("symbols.json", { generatedAt: new Date().toISOString(), items: symbols });
  await writeJson("relationships.json", { generatedAt: new Date().toISOString(), items: relationships });
  await writeJson("character_patterns.json", { generatedAt: new Date().toISOString(), ...charPatterns });
  await writeJson("narrative_patterns.json", { generatedAt: new Date().toISOString(), items: narrativePatterns });
  await writeJson("visual_patterns.json", { generatedAt: new Date().toISOString(), items: visualPatterns });
  await writeJson("dialogue_patterns.json", { generatedAt: new Date().toISOString(), items: dialoguePatterns });
  await writeJson("relations.json", { generatedAt: new Date().toISOString(), ...relations });
}

async function writeJson(name: string, data: unknown): Promise<void> {
  await writeFile(path.join(KNOWLEDGE_BASE_DIR, name), JSON.stringify(data, null, 2), "utf8");
}

export async function seedMinimalKnowledgeBase(): Promise<void> {
  const { buildUniverseTaxonomy } = await import("../taxonomy/universe");
  await buildUniverseTaxonomy();
  const themes: ThemeEntry[] = [
    { id: "bar_life", label: "Vida de bar", weight: 1, subthemes: ["ultima ronda"], sourceChunks: [] },
    { id: "melancholy", label: "Melancolía", weight: 0.9, subthemes: ["nostalgia"], sourceChunks: [] },
    { id: "failed_love", label: "Amor imposible", weight: 0.85, subthemes: [], sourceChunks: [] },
  ];
  await writeJson("themes.json", { generatedAt: new Date().toISOString(), items: themes });
  await writeJson("emotions.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "melancholy", label: "Melancolía", weight: 1, valence: "negative", intensity: 0.8, pairedThemes: ["melancholy"], sourceChunks: [] }],
  });
  await writeJson("archetypes.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "failed_poet", label: "Poeta fracasado", weight: 1, traits: ["cínico"], typicalConflicts: ["auto_sabotage"], visualCues: ["desaliñado"], sourceChunks: [] }],
  });
  await writeJson("conflicts.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "self_sabotage", label: "Auto-sabotaje", weight: 1, type: "interior", stakes: "dignidad", resolutionPatterns: ["ironía"], sourceChunks: [] }],
  });
  await writeJson("locations.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "neighborhood_bar", label: "Bar de barrio", weight: 1, atmosphere: "íntima", timeOfDay: "noche", sensoryTags: ["vermut"], sourceChunks: [] }],
  });
  await writeJson("symbols.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "empty_glass", label: "Vaso vacío", weight: 1, meaning: "vacío", recurrenceWeight: 0.9, sourceChunks: [] }],
  });
  await writeJson("relationships.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "broken_friendship", label: "Amistad rota", weight: 1, dynamic: "distancia", tensionCurve: "decae", sourceChunks: [] }],
  });
  await writeJson("character_patterns.json", {
    generatedAt: new Date().toISOString(),
    motivations: [{ id: "escape_boredom", label: "Escapar del aburrimiento", weight: 1, examples: [], sourceChunks: [] }],
    failures: [{ id: "cant_hold_love", label: "No sostener amor", weight: 1, examples: [], sourceChunks: [] }],
    desires: [{ id: "one_more_drink", label: "Un trago más", weight: 1, examples: [], sourceChunks: [] }],
    obsessions: [{ id: "writing", label: "Escritura", weight: 1, examples: [], sourceChunks: [] }],
  });
  await writeJson("narrative_patterns.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "three_act_anecdote", label: "Anécdota en tres actos", weight: 1, structure: "setup-confrontation-twist", pacing: "rápido-lento", endingTypes: ["ironía amarga"], sourceChunks: [] }],
  });
  await writeJson("visual_patterns.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "noir_bar", label: "Bar noir", weight: 1, palette: ["#1a1a1a"], lighting: "neón", cameraTendencies: ["plano medio"], sourceChunks: [] }],
  });
  await writeJson("dialogue_patterns.json", {
    generatedAt: new Date().toISOString(),
    items: [{ id: "dry_bartender", label: "Camarero seco", weight: 1, register: "coloquial", rhythm: "corto", subtextLevel: "high", sourceChunks: [] }],
  });
  await writeJson("relations.json", {
    generatedAt: new Date().toISOString(),
    themeToEmotion: [{ themeId: "bar_life", emotionId: "melancholy", weight: 0.9 }],
    themeToConflict: [{ themeId: "bar_life", conflictId: "self_sabotage", weight: 0.8 }],
    archetypeToTheme: [{ archetypeId: "failed_poet", themeId: "melancholy", weight: 0.85 }],
  });
}

export async function runBuildKnowledgeBase(): Promise<{ filesWritten: number }> {
  const raw = await loadRawExtractions();
  if (raw.length === 0) {
    await seedMinimalKnowledgeBase();
  } else {
    await buildKnowledgeBaseFromExtractions(raw.map((r) => ({ extraction: r.extraction })));
  }
  await appendStoryUniverseChangelog(`build-knowledge-base: ${raw.length} extractions processed`);
  return { filesWritten: 12 };
}

export async function loadKnowledgeFile<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(KNOWLEDGE_BASE_DIR, name), "utf8")) as T;
  } catch {
    return null;
  }
}
