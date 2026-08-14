/**
 * AI 水墨素材目錄（WebP）
 * 實體檔：`public/ink/ai/{backdrops,banners,motifs,seals}/`
 * 風格約束：`design/art/STYLE-BIBLE.md`
 * 出圖提示：`design/art/AI-PROMPT-PACK.md`
 */

export type InkAiKind = 'backdrop' | 'banner' | 'motif' | 'seal';

export type InkAiAsset = {
  id: string;
  kind: InkAiKind;
  /** 相對 `public/ink/` 的路徑 */
  path: string;
  titleZh: string;
  /** 何時用：給文案／系統設計師掃一眼 */
  useWhen: string;
  tags: string[];
};

/** 與 inkAssets.inkUrl 同規；本地實作避免循環依賴 */
function inkPublicUrl(pathUnderInk: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleaned = pathUnderInk.replace(/^\/+/, '');
  return `${base}ink/${cleaned}?v=ai1`;
}

/** 全部 AI 素材（可 import 後遍歷／搜尋） */
export const INK_AI_ASSETS: readonly InkAiAsset[] = [
  {
    id: 'backdrop-title-scroll',
    kind: 'backdrop',
    path: 'ai/backdrops/backdrop-title-scroll.webp',
    titleZh: '開卷遠山',
    useWhen: '首屏／品牌底，上方留白給標題',
    tags: ['start', 'hero', 'mountains'],
  },
  {
    id: 'backdrop-night-mountains',
    kind: 'backdrop',
    path: 'ai/backdrops/backdrop-night-mountains.webp',
    titleZh: '夜山松煙',
    useWhen: '夜雨、晚年、肅穆章節底',
    tags: ['night', 'omen', 'legacy'],
  },
  {
    id: 'backdrop-town-scroll',
    kind: 'backdrop',
    path: 'ai/backdrops/backdrop-town-scroll.webp',
    titleZh: '千燈鎮卷',
    useWhen: '鎮居主景，遠山、石橋與鎮屋',
    tags: ['home', 'town', 'bridge', 'mountains'],
  },
  {
    id: 'backdrop-result-mist',
    kind: 'backdrop',
    path: 'ai/backdrops/backdrop-result-mist.webp',
    titleZh: '結算霧嶺',
    useWhen: '結果匣淡墨底，不搶正文',
    tags: ['result', 'mist', 'ridge'],
  },
  {
    id: 'banner-bridge-mist',
    kind: 'banner',
    path: 'ai/banners/banner-bridge-mist.webp',
    titleZh: '霧橋',
    useWhen: '路遇、相逢、過橋',
    tags: ['road', 'encounter', 'bridge'],
  },
  {
    id: 'banner-rain-inn',
    kind: 'banner',
    path: 'ai/banners/banner-rain-inn.webp',
    titleZh: '夜雨投店',
    useWhen: '雨夜、客棧、酒',
    tags: ['rain', 'inn', 'night'],
  },
  {
    id: 'banner-sect-gate',
    kind: 'banner',
    path: 'ai/banners/banner-sect-gate.webp',
    titleZh: '山門',
    useWhen: '拜師、門派、入門',
    tags: ['sect', 'gate', 'martial'],
  },
  {
    id: 'banner-bamboo-practice',
    kind: 'banner',
    path: 'ai/banners/banner-bamboo-practice.webp',
    titleZh: '竹林習武',
    useWhen: '修煉、日常練習',
    tags: ['practice', 'bamboo', 'martial'],
  },
  {
    id: 'banner-sword-road',
    kind: 'banner',
    path: 'ai/banners/banner-sword-road.webp',
    titleZh: '劍影陌路',
    useWhen: '戰鬥、劫道、兵刃',
    tags: ['combat', 'sword', 'road'],
  },
  {
    id: 'banner-courtyard',
    kind: 'banner',
    path: 'ai/banners/banner-courtyard.webp',
    titleZh: '庭院家門',
    useWhen: '家庭、歸鄉、日常',
    tags: ['family', 'home', 'courtyard'],
  },
  {
    id: 'banner-lonely-boat',
    kind: 'banner',
    path: 'ai/banners/banner-lonely-boat.webp',
    titleZh: '孤舟煙波',
    useWhen: '遠行、漂泊、渡水',
    tags: ['travel', 'boat', 'wander'],
  },
  {
    id: 'banner-legacy-stele',
    kind: 'banner',
    path: 'ai/banners/banner-legacy-stele.webp',
    titleZh: '殘碑傳承',
    useWhen: '老年、死亡、總結、傳承',
    tags: ['legacy', 'death', 'old'],
  },
  {
    id: 'banner-bond-plum',
    kind: 'banner',
    path: 'ai/banners/banner-bond-plum.webp',
    titleZh: '梅影結緣',
    useWhen: '戀愛、結緣、情誼',
    tags: ['romance', 'bond', 'plum'],
  },
  {
    id: 'banner-market',
    kind: 'banner',
    path: 'ai/banners/banner-market.webp',
    titleZh: '市井布幌',
    useWhen: '買賣、經濟、市集',
    tags: ['economy', 'market', 'career'],
  },
  {
    id: 'banner-mountain-road',
    kind: 'banner',
    path: 'ai/banners/banner-mountain-road.webp',
    titleZh: '竹雨山亭',
    useWhen: '一般路遇、故人、未另有專景的事件',
    tags: ['road', 'encounter', 'arc', 'rain'],
  },
  {
    id: 'motif-sword',
    kind: 'motif',
    path: 'ai/motifs/motif-sword.webp',
    titleZh: '劍',
    useWhen: '武技／武器符號',
    tags: ['icon', 'sword'],
  },
  {
    id: 'motif-umbrella',
    kind: 'motif',
    path: 'ai/motifs/motif-umbrella.webp',
    titleZh: '傘',
    useWhen: '雨夜／旅人符號',
    tags: ['icon', 'umbrella'],
  },
  {
    id: 'motif-jade',
    kind: 'motif',
    path: 'ai/motifs/motif-jade.webp',
    titleZh: '玉佩',
    useWhen: '信物／珍寶',
    tags: ['icon', 'jade'],
  },
  {
    id: 'motif-wine-banner',
    kind: 'motif',
    path: 'ai/motifs/motif-wine-banner.webp',
    titleZh: '酒旗',
    useWhen: '客棧／市井',
    tags: ['icon', 'wine'],
  },
  {
    id: 'motif-lantern',
    kind: 'motif',
    path: 'ai/motifs/motif-lantern.webp',
    titleZh: '燈籠',
    useWhen: '夜色／節慶',
    tags: ['icon', 'lantern'],
  },
  {
    id: 'motif-scroll',
    kind: 'motif',
    path: 'ai/motifs/motif-scroll.webp',
    titleZh: '卷軸',
    useWhen: '秘籍／記事',
    tags: ['icon', 'scroll'],
  },
  {
    id: 'motif-mountain-gate',
    kind: 'motif',
    path: 'ai/motifs/motif-mountain-gate.webp',
    titleZh: '山門',
    useWhen: '門派符號',
    tags: ['icon', 'sect'],
  },
  {
    id: 'seal-cinnabar-fate',
    kind: 'seal',
    path: 'ai/seals/seal-cinnabar-fate.webp',
    titleZh: '朱砂命運印',
    useWhen: '出生、蓋印確認、死亡落款',
    tags: ['seal', 'cinnabar', 'fate'],
  },
] as const;

export type InkAiAssetId = (typeof INK_AI_ASSETS)[number]['id'];

const BY_ID = Object.fromEntries(INK_AI_ASSETS.map((a) => [a.id, a])) as Record<
  InkAiAssetId,
  InkAiAsset
>;

export function getInkAiAsset(id: InkAiAssetId): InkAiAsset {
  return BY_ID[id];
}

/** 回傳可直接給 <img src> 的 URL（含 cache bust） */
export function inkAiUrl(id: InkAiAssetId): string {
  return inkPublicUrl(BY_ID[id].path);
}

export function listInkAiByKind(kind: InkAiKind): InkAiAsset[] {
  return INK_AI_ASSETS.filter((a) => a.kind === kind);
}

export function findInkAiByTag(tag: string): InkAiAsset[] {
  const t = tag.toLowerCase();
  return INK_AI_ASSETS.filter((a) => a.tags.some((x) => x.toLowerCase() === t));
}

/** 事件橫幅 ID（對應 banners） */
export type AiEventBannerId =
  | 'bridge-mist'
  | 'mountain-road'
  | 'rain-inn'
  | 'sect-gate'
  | 'bamboo-practice'
  | 'sword-road'
  | 'courtyard'
  | 'lonely-boat'
  | 'legacy-stele'
  | 'bond-plum'
  | 'market'
  | 'none';

const BANNER_ID_MAP: Record<Exclude<AiEventBannerId, 'none'>, InkAiAssetId> = {
  'bridge-mist': 'banner-bridge-mist',
  'mountain-road': 'banner-mountain-road',
  'rain-inn': 'banner-rain-inn',
  'sect-gate': 'banner-sect-gate',
  'bamboo-practice': 'banner-bamboo-practice',
  'sword-road': 'banner-sword-road',
  courtyard: 'banner-courtyard',
  'lonely-boat': 'banner-lonely-boat',
  'legacy-stele': 'banner-legacy-stele',
  'bond-plum': 'banner-bond-plum',
  market: 'banner-market',
};

/** 依標題／正文／標籤挑選 AI 橫幅 */
export function pickAiEventBanner(opts: {
  title?: string;
  body?: string;
  tags?: string[];
}): AiEventBannerId {
  const tags = opts.tags ?? [];
  const blob = `${opts.title ?? ''}${opts.body ?? ''}${tags.join('')}`;

  if (/死|葬|傳承|遺言|墓|碑|老年|臨終/.test(blob) || tags.includes('legacy')) {
    return 'legacy-stele';
  }
  if (/戀|情|婚|緣|梅|紅顏|相思/.test(blob) || tags.includes('romance')) {
    return 'bond-plum';
  }
  if (/門派|拜師|山門|入門|掌門|宗/.test(blob) || tags.includes('sect')) {
    return 'sect-gate';
  }
  if (/戰|鬥|劫|殺|劍|刀|匪|對決/.test(blob) || tags.includes('combat')) {
    return 'sword-road';
  }
  if (/雨|夜|店|客棧|酒/.test(blob)) return 'rain-inn';
  if (/竹|練|習武|修煉|打坐/.test(blob) || tags.includes('practice_wander') || tags.includes('martial')) {
    return 'bamboo-practice';
  }
  if (/家|父|母|兄|弟|妻|子|庭|歸/.test(blob) || tags.includes('family')) {
    return 'courtyard';
  }
  if (/買|賣|銀|錢|市|當鋪|商/.test(blob) || tags.includes('economy') || tags.includes('career')) {
    return 'market';
  }
  if (/船|渡|江|湖|遠行|漂|旅/.test(blob) || tags.includes('travel') || tags.includes('region')) {
    return 'lonely-boat';
  }
  if (/橋|河|渡|水岸/.test(blob)) {
    return 'bridge-mist';
  }
  if (
    /亭|山道|官道|林|故人|訪|逢|遇|路/.test(blob) ||
    tags.includes('road') ||
    tags.includes('pack') ||
    tags.includes('special') ||
    tags.includes('arc')
  ) {
    return 'mountain-road';
  }
  return 'mountain-road';
}

export function aiEventBannerUrl(kind: AiEventBannerId): string | null {
  if (kind === 'none') return null;
  return inkAiUrl(BANNER_ID_MAP[kind]);
}
