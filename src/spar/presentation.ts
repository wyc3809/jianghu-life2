/** 第23項演武美術試版參數。純視覺，唔改攻擊／結算時序。 */
export type SparSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export const SPAR_ART_BASE = `${import.meta.env.BASE_URL || '/'}ink/spar/commercial/`;
export const SPAR_PRESENTATION = {
  ground: .845,
  // 一個步行循環行52px，腳步由真正位移而非時間驅動。
  strideDistance: 52,
  collapseContact: .3,
  sceneFade: .6,
} as const;

export function advanceGait(cycle: number, distance: number, stageHeight: number): number {
  if (!Number.isFinite(distance) || distance <= 0 || stageHeight <= 0) return cycle;
  return cycle + distance / (SPAR_PRESENTATION.strideDistance * stageHeight / 218);
}

export function gaitFrame(cycle: number): number {
  return Math.floor(((cycle % 1) + 1) % 1 * 4) % 4;
}

/** 固定地面錨點；落地後先淡出，唔再整張角色飛走／旋轉。 */
export function collapseSample(time: number, duration = .62) {
  const p = Math.max(0, Math.min(1, time / duration));
  return {
    frame: p < .18 ? 0 : p < .4 ? 1 : p < .63 ? 2 : 3,
    alpha: p < .76 ? 1 : Math.max(0, (1 - p) / .24),
    contact: p >= .48,
    recoil: 1 - (1 - Math.min(1, p / .48)) ** 2,
  };
}

export function crossedGroundContact(previous: number, current: number): boolean {
  return previous < SPAR_PRESENTATION.collapseContact && current >= SPAR_PRESENTATION.collapseContact;
}

export interface SparArtImages {
  seasons: Record<SparSeason, HTMLImageElement>;
  walk: HTMLImageElement[];
  heroDown: HTMLImageElement[];
  deaths: Map<string, HTMLImageElement[]>;
  dust: HTMLImageElement;
  landing: HTMLImageElement;
  slash: HTMLImageElement;
  impact: HTMLImageElement;
  mist: HTMLImageElement;
  shadow: HTMLImageElement;
  weather: Record<SparSeason, HTMLImageElement>;
}

let artPromise: Promise<SparArtImages> | null = null;
export function loadSparArt(): Promise<SparArtImages> {
  if (artPromise) return artPromise;
  const load = (name: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`演武位圖載入失敗：${name}`));
    image.src = `${SPAR_ART_BASE}${name}.webp`;
  });
  const seasons: SparSeason[] = ['spring', 'summer', 'autumn', 'winter'];
  artPromise = Promise.all([
    Promise.all(seasons.map(s => load(`season-${s}`))),
    Promise.all([0, 1, 2, 3].map(i => load(`hero-walk-${i}`))),
    Promise.all([0, 1, 2, 3].map(i => load(`hero-down-${i}`))),
    Promise.all(['step-dust', 'land-dust', 'slash', 'impact', 'mist', 'shadow', 'petal', 'rain', 'leaf', 'snow'].map(load)),
  ]).then(([backgrounds, walk, heroDown, fx]) => ({
    seasons: Object.fromEntries(seasons.map((s, i) => [s, backgrounds[i]!])) as Record<SparSeason, HTMLImageElement>,
    walk, heroDown, deaths: new Map(),
    dust: fx[0]!, landing: fx[1]!, slash: fx[2]!, impact: fx[3]!, mist: fx[4]!, shadow: fx[5]!,
    weather: Object.fromEntries(seasons.map((s, i) => [s, fx[i + 6]!])) as Record<SparSeason, HTMLImageElement>,
  })).catch(error => { artPromise = null; throw error; });
  return artPromise;
}

const deathCache = new Map<string, Promise<HTMLImageElement[]>>();
/** 各敵人逐款按需載入，唔一次迫手機下載100張圖。 */
export function loadFoeCollapse(src: string): Promise<HTMLImageElement[]> {
  const key = /enemy-([a-z0-9_]+)\.webp/.exec(src)?.[1];
  if (!key) return Promise.reject(new Error('敵人缺少位圖代號'));
  const hit = deathCache.get(key);
  if (hit) return hit;
  const promise = Promise.all([0, 1, 2, 3].map(i => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject;
    img.src = `${SPAR_ART_BASE}enemy-${key}-down-${i}.webp`;
  }))).catch(error => { deathCache.delete(key); throw error; });
  deathCache.set(key, promise);
  return promise;
}
