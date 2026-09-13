# No SVG for game content art

Gameplay art (characters, enemies, weapons, FX sprites, stage props) MUST be bitmap assets (WebP/PNG), never SVG or canvas path/"puppet" silhouettes that mimic SVG.

- Allowed SVG only for: app icons / PWA chrome if already present, or pure UI chrome that is not character art — prefer migrating those to bitmap when touched.
- Spar / combat / life-sim stage characters: AI-generated or authored WebP under `public/ink/…` only.
- Do not reintroduce `silhouetteDraw` path geometry for characters.
