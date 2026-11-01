import atlas from "./layout.json";
import type { WarAssets, WarPose } from "./assets";
import {
  readAppearance,
  type CharacterAppearance,
} from "@interfaces/appearance";
import { APPEARANCE_COLOURS } from "@data/appearances";
import { appearanceComposition } from "../appearance/pose";
import { appearanceHead, drawNeck } from "../appearance/neck";
import weaponLayout from "./weapon-layout.json";
const caches = new WeakMap<WarAssets, Map<string, HTMLCanvasElement>>();
type FacePatch = {
  image: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
};
const faces = new WeakMap<WarAssets, Map<string, FacePatch>>();
function faceFor(assets: WarAssets, a: CharacterAppearance): FacePatch {
  let cache = faces.get(assets);
  if (!cache) {
    cache = new Map();
    faces.set(assets, cache);
  }
  const key = `${a.head}:${a.outfit}`,
    old = cache.get(key);
  if (old) return old;
  const head = assets.common.wardrobe.heads[a.head];
  const p = appearanceComposition(
    a,
    "idle",
    head.naturalWidth / head.naturalHeight,
  );
  p.neck = { x: 0, y: 0 };
  const x = Math.min(-32, p.head.x) - 2,
    y = Math.min(-46, p.head.y) - 2;
  const width = Math.ceil(Math.max(35, p.head.x + p.head.width) - x + 2);
  const height = Math.ceil(Math.max(19, p.head.y + p.head.height) - y + 2);
  const image = document.createElement("canvas");
  image.width = width * 2;
  image.height = height * 2;
  const ctx = image.getContext("2d")!;
  ctx.scale(2, 2);
  ctx.translate(-x, -y);
  drawNeck(ctx, assets.common.wardrobe, a, p);
  ctx.drawImage(
    appearanceHead(assets.common.wardrobe, a, p),
    p.head.x,
    p.head.y,
    p.head.width,
    p.head.height,
  );
  const patch = { image, x, y, width, height };
  cache.set(key, patch);
  return patch;
}
function bodyFor(
  assets: WarAssets,
  a: CharacterAppearance,
  frame: WarPose,
): HTMLCanvasElement {
  let cache = caches.get(assets);
  if (!cache) {
    cache = new Map();
    caches.set(assets, cache);
  }
  const key = `${a.outfit}:${a.tone}:${frame}`,
    old = cache.get(key);
  if (old) return old;
  const image = assets.bodies[a.outfit][frame],
    c = document.createElement("canvas");
  c.width = image.naturalWidth;
  c.height = image.naturalHeight;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(image, 0, 0);
  const pixels = x.getImageData(0, 0, c.width, c.height),
    d = pixels.data,
    tone = APPEARANCE_COLOURS[a.tone];
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    if (d[i + 3] > 0 && b - r > 5 && b >= g) {
      const s = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 92;
      d[i] = Math.min(247, tone[0] * s);
      d[i + 1] = Math.min(247, tone[1] * s);
      d[i + 2] = Math.min(247, tone[2] * s);
    }
  }
  x.putImageData(pixels, 0, 0);
  cache.set(key, c);
  if (cache.size > 144) cache.delete(cache.keys().next().value!);
  return c;
}
/** 原畫完整姿勢與真正領口／手掌錨點；不拉伸獨立肢體，騰空不改人物大小。 */
export function drawWarCharacter(
  ctx: CanvasRenderingContext2D,
  assets: WarAssets,
  value: unknown,
  pose: WarPose,
  x: number,
  y: number,
  height: number,
  face: number,
  family: string,
): void {
  const a = readAppearance(value),
    body = bodyFor(assets, a, pose),
    set = atlas[a.outfit],
    m = set[pose],
    unit = 1 / set.pixelsPerUnit,
    head = assets.common.wardrobe.heads[a.head];
  const p = appearanceComposition(
    a,
    "idle",
    head.naturalWidth / head.naturalHeight,
  );
  p.body = {
    x: -m.origin[0] * unit,
    y: -m.origin[1] * unit,
    width: m.width * unit,
    height: m.height * unit,
  };
  p.neck = { x: p.body.x + m.neck[0] * unit, y: p.body.y + m.neck[1] * unit };
  p.grip = { x: p.body.x + m.grip[0] * unit, y: p.body.y + m.grip[1] * unit };
  p.head.rotation = m.rotation;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((face * height) / 400, height / 400);
  const kind = (
      {
        sword: "sword",
        blade: "blade",
        spear: "spear",
        staff: "staff",
        needle: "hidden",
        bow: "bow",
        whip: "whip",
      } as Record<string, keyof typeof weaponLayout>
    )[family],
    weapon = assets.weapons[kind],
    def = weaponLayout[kind];
  if (weapon && def && pose !== "down") {
    const gripping = !("weaponGrip" in m) || m.weaponGrip !== false;
    const angle =
      pose === "windup"
        ? -2.45
        : pose === "strikeA"
          ? -1.68
          : pose === "strikeB"
            ? -1.1
            : pose === "jump"
              ? -1.0
              : pose === "guard"
                ? -1.35
                : -0.35;
    const dx = def.tip[0] - def.grip[0],
      dy = def.tip[1] - def.grip[1],
      s =
        (kind === "spear" || kind === "staff"
          ? 210
          : kind === "hidden"
            ? 35
            : kind === "bow"
              ? 110
              : 150) / Math.max(1, Math.hypot(dx, dy));
    ctx.save();
    ctx.translate(
      gripping ? p.grip.x : p.neck.x - 10,
      gripping ? p.grip.y : p.neck.y + 42,
    );
    ctx.rotate((gripping ? Math.PI / 2 + angle : -2.0) - Math.atan2(dy, dx));
    ctx.drawImage(
      weapon,
      -def.grip[0] * s,
      -def.grip[1] * s,
      def.width * s,
      def.height * s,
    );
    ctx.restore();
  }
  ctx.drawImage(body, p.body.x, p.body.y, p.body.width, p.body.height);
  const facePatch = faceFor(assets, a);
  ctx.save();
  ctx.translate(p.neck.x, p.neck.y);
  ctx.rotate(p.head.rotation);
  ctx.drawImage(
    facePatch.image,
    facePatch.x,
    facePatch.y,
    facePatch.width,
    facePatch.height,
  );
  ctx.restore();
  ctx.restore();
}
/** 開戰前分批預熱調色，避免二十人首次出招才同步讀像素。 */
export async function primeWarCharacters(
  assets: WarAssets,
  values: unknown[],
  cancelled: () => boolean,
): Promise<void> {
  const seen = new Set<string>();
  const seenFaces = new Set<string>();
  for (const value of values) {
    if (cancelled()) return;
    const a = readAppearance(value);
    const faceKey = `${a.head}:${a.outfit}`;
    if (!seenFaces.has(faceKey)) {
      seenFaces.add(faceKey);
      faceFor(assets, a);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const key = a.outfit + ":" + a.tone;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const pose of Object.keys(assets.bodies[a.outfit]) as WarPose[]) {
      if (cancelled()) return;
      bodyFor(assets, a, pose);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
