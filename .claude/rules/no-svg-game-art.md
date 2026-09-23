# No SVG — game art and UI alike

All visuals MUST be bitmap assets (WebP/PNG), never SVG (inline `<svg>`, `.svg` files, or `data:image/svg+xml` URIs) or canvas path/"puppet" silhouettes that mimic SVG.

- **Game art** (characters, enemies, weapons, FX sprites, stage props): AI-generated or authored WebP under `public/ink/…` only. Do not reintroduce `silhouetteDraw` path geometry for characters.
- **UI too** — progress bars, rings, gauges, charts, dividers, corner frames, noise/grain textures: no SVG. Use brush-texture WebP (`public/ink/art/ui/`) as CSS `mask-image` / `background`, animated with CSS (`clip-path`, conic-gradient masks, transforms). Shared components: `src/components/ink/InkBrush.tsx` (`InkBrushBar`, `InkBrushRing`).
- Seals / auras / action strokes: `public/ink/art/{seals,auras,strokes}/` via `src/ui/inkAssets.ts`.
- Regenerate textures with `scripts/art/build_ink_ui.py` and `scripts/art/build_ink_stamps.py`; AI-generated replacements may drop in at the same path and size.
- Only exception: PWA app icons already present (`public/icon-*.svg`).
