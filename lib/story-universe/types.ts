/** Shared types for the Cocktail Story Universe Engine */

export type KnowledgeEntity = {
  id: string;
  label: string;
  weight: number;
  sourceChunks?: string[];
};

export type ThemeEntry = KnowledgeEntity & {
  subthemes: string[];
};

export type EmotionEntry = KnowledgeEntity & {
  valence: "negative" | "neutral" | "positive" | "mixed";
  intensity: number;
  pairedThemes: string[];
};

export type ArchetypeEntry = KnowledgeEntity & {
  traits: string[];
  typicalConflicts: string[];
  visualCues: string[];
};

export type ConflictEntry = KnowledgeEntity & {
  type: string;
  stakes: string;
  resolutionPatterns: string[];
};

export type LocationEntry = KnowledgeEntity & {
  atmosphere: string;
  timeOfDay: string;
  sensoryTags: string[];
};

export type SymbolEntry = KnowledgeEntity & {
  meaning: string;
  recurrenceWeight: number;
};

export type RelationshipEntry = KnowledgeEntity & {
  dynamic: string;
  tensionCurve: string;
};

export type CharacterPatterns = {
  motivations: Array<KnowledgeEntity & { examples: string[] }>;
  failures: Array<KnowledgeEntity & { examples: string[] }>;
  desires: Array<KnowledgeEntity & { examples: string[] }>;
  obsessions: Array<KnowledgeEntity & { examples: string[] }>;
};

export type NarrativePatternEntry = KnowledgeEntity & {
  structure: string;
  pacing: string;
  endingTypes: string[];
};

export type VisualPatternEntry = KnowledgeEntity & {
  palette: string[];
  lighting: string;
  cameraTendencies: string[];
};

export type DialoguePatternEntry = KnowledgeEntity & {
  register: string;
  rhythm: string;
  subtextLevel: "low" | "medium" | "high";
};

export type KnowledgeRelations = {
  themeToEmotion: Array<{ themeId: string; emotionId: string; weight: number }>;
  themeToConflict: Array<{ themeId: string; conflictId: string; weight: number }>;
  archetypeToTheme: Array<{ archetypeId: string; themeId: string; weight: number }>;
};

export type UniverseCategory = {
  id: string;
  label: string;
  themeIds: string[];
  conflictIds: string[];
  archetypeIds: string[];
  locationIds: string[];
  weight: number;
};

export type GenerationQuota = {
  categoryId: string;
  targetCount: number;
  label: string;
};

export type CocktailNarrativeProfile = {
  cocktailSlug: string;
  cocktailTitle: string;
  aromaticProfile: string[];
  tasteProfile: string[];
  color: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  personality: string[];
  symbolism: string[];
  evokedSensations: string[];
  narrativeHooks: string[];
  originHint?: string;
};

export type ChunkExtraction = {
  chunkId: string;
  sourceTitle: string;
  sourceAuthor: string;
  themes: string[];
  subthemes: string[];
  emotions: string[];
  scenarios: string[];
  conflicts: string[];
  relationships: string[];
  symbols: string[];
  recurringObjects: string[];
  archetypes: string[];
  dialoguePatterns: string[];
  narrativeStructures: string[];
  narrativeRhythms: string[];
  emotionalTone: string;
  endingTypes: string[];
  characterTypes: string[];
  motivations: string[];
  failures: string[];
  desires: string[];
  obsessions: string[];
};

export type CorpusChunkManifest = {
  chunkId: string;
  sourceFile: string;
  sourceTitle: string;
  sourceAuthor: string;
  chapterIndex: number;
  wordCount: number;
};

export type CorpusManifest = {
  generatedAt: string;
  corpusPath: string;
  sources: Array<{ file: string; title: string; author: string; chunkCount: number }>;
  chunks: CorpusChunkManifest[];
};

export type StoryCharacter = {
  name: string;
  role: string;
  archetype?: string;
  motivation?: string;
};

export type StoryLocation = {
  name: string;
  atmosphere: string;
};

export type StoryConflict = {
  type: string;
  description: string;
  stakes: string;
};

export type StoryResolution = {
  type: string;
  description: string;
};

export type VisualIdentity = {
  palette: string[];
  lighting: string;
  era: string;
  mood: string;
};

export type StoryDraft = {
  storyId: string;
  title: string;
  logline: string;
  theme: string;
  subthemes: string[];
  cocktailReference: string;
  emotionProfile: Record<string, number>;
  characterList: StoryCharacter[];
  locations: StoryLocation[];
  conflict: StoryConflict;
  resolution: StoryResolution;
  visualIdentity: VisualIdentity;
  animationPotential: number;
  categoryId: string;
};

export type ScreenplayAct = {
  act: 1 | 2 | 3;
  beats: Array<{
    beatNumber: number;
    heading: string;
    action: string;
    dialogue?: Array<{ character: string; line: string }>;
    emotion: string;
  }>;
};

export type StoryScriptPayload = {
  synopsis: string;
  treatment: string;
  screenplay: { acts: ScreenplayAct[] };
  estimatedRuntimeMins: number;
  wordCount: number;
};

export type StoryboardScene = {
  sceneNumber: number;
  description: string;
  camera: string;
  movement: string;
  lighting: string;
  atmosphere: string;
  musicSuggestion: string;
  durationSecs: number;
};

export type AnimationPromptBundle = {
  sceneNumber: number;
  masterImagePrompt: string;
  videoPrompt: string;
  motionPrompt: string;
  lightingPrompt: string;
  cameraPrompt: string;
  soundPrompt: string;
  voicePrompt: string;
};

export type QcResult = {
  passed: boolean;
  score: number;
  issues: string[];
};

export type StoryStatus = "DRAFT" | "QC_PASSED" | "QC_FAILED" | "APPROVED" | "SCRIPTED" | "STORYBOARDED" | "READY";
