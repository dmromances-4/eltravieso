# Pipeline de animación

## Flujo

```
Story → StoryScript (3 actos) → StoryStoryboard (40–80 escenas)
  → StoryAnimationPrompt (7 prompts/escena) → Remotion StoryEpisode
```

## Prompts por escena

- masterImagePrompt, videoPrompt, motionPrompt
- lightingPrompt, cameraPrompt, soundPrompt, voicePrompt

Extiende `lib/animation/classic-cartoon-prompts.ts` (estilo cartoon 60s–80s, marca El Travieso).

## Remotion

- Composición: `remotion/story-episode/StoryEpisode.tsx`
- Una secuencia por escena del storyboard
- Duración dinámica desde `durationSecs`

CLI:

```bash
npm run generate:storyboards -- --story-id STORY-0001
npm run generate:animation-prompts -- --story-id STORY-0001 --dry-run
```

Ver también: [docs/GUIA-REFERENCIA-ANIMACION.md](../GUIA-REFERENCIA-ANIMACION.md)
