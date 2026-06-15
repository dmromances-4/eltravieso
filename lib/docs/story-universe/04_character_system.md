# Sistema de personajes

Personajes emergen de:

- `knowledge_base/archetypes.json`
- `knowledge_base/character_patterns.json` (motivaciones, fracasos, deseos, obsesiones)

Cada historia incluye `characterList`:

```json
{ "name": "...", "role": "...", "archetype": "...", "motivation": "..." }
```

Arquetipos seed: poeta fracasado, camarero filósofo, apostador, anti-héroe entrañable.

Visual cues en arquetipos alimentan prompts cartoon (`lib/animation/classic-cartoon-prompts.ts`).
