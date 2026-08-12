/**
 * 人生差異層（題眼／關路／心性可見／余韻／墓誌）
 * 不改引擎骨架，只透過 flags + 權重 + 文案改「每世形狀」。
 */
import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { natureLabels, type NatureAttr } from '@interfaces/lifeEngine';
import { dominantNature, ensureNature } from './nature';
import { getRng } from '@core/random';
import { displayGearName } from './equipment';

export const LIFE_THEME_IDS = [
  'revenge',
  'fame',
  'master',
  'wealth',
  'reclusion',
  'clan',
] as const;

export type LifeThemeId = (typeof LIFE_THEME_IDS)[number];

export type LifeThemeDef = {
  id: LifeThemeId;
  label: string;
  vow: string;
  /** 抬權重的事件 tags */
  boostTags: string[];
  /** 壓權重的事件 tags */
  muteTags: string[];
  /** 對應短弧偏好 */
  preferArcIds?: string[];
};

export const LIFE_THEMES: Record<LifeThemeId, LifeThemeDef> = {
  revenge: {
    id: 'revenge',
    label: '報仇',
    vow: '此生要了結一樁舊怨。',
    boostTags: ['combat', 'road', 'boss', 'grudge', 'special'],
    muteTags: ['romance', 'quiet'],
    preferArcIds: ['arc_yue_spar'],
  },
  fame: {
    id: 'fame',
    label: '求名',
    vow: '要讓名字響過酒旗。',
    boostTags: ['sect', 'combat', 'story', 'pack', 'special'],
    muteTags: ['economy'],
    preferArcIds: ['arc_yue_spar'],
  },
  master: {
    id: 'master',
    label: '尋師',
    vow: '要找一個肯教真功夫的人。',
    boostTags: ['martial', 'secret', 'sect', 'practice', 'story'],
    muteTags: ['economy'],
    preferArcIds: ['arc_lu_ink', 'arc_yue_spar'],
  },
  wealth: {
    id: 'wealth',
    label: '發財',
    vow: '銀兩進匣，比刀快。',
    boostTags: ['economy', 'career', 'ordinary', 'market'],
    muteTags: ['combat', 'boss'],
    preferArcIds: ['arc_shen_heal'],
  },
  reclusion: {
    id: 'reclusion',
    label: '避世',
    vow: '能躲過江湖最好，躲不過也只求少事。',
    boostTags: ['ordinary', 'family', 'story'],
    muteTags: ['combat', 'boss', 'road', 'pack'],
    preferArcIds: ['arc_lu_ink', 'arc_shen_heal'],
  },
  clan: {
    id: 'clan',
    label: '護族',
    vow: '家門不能斷在自己手上。',
    boostTags: ['family', 'romance', 'inheritance', 'story'],
    muteTags: ['boss'],
    preferArcIds: ['arc_shen_heal'],
  },
};

export function isLifeThemeId(v: unknown): v is LifeThemeId {
  return typeof v === 'string' && (LIFE_THEME_IDS as readonly string[]).includes(v);
}

export function getLifeTheme(state: LifeGameState): LifeThemeDef {
  const id = state.character.flags.life_theme;
  if (isLifeThemeId(id)) return LIFE_THEMES[id];
  return LIFE_THEMES.fame;
}

export function themeLabelOf(state: LifeGameState): string {
  return getLifeTheme(state).label;
}

/** 開局或讀檔補題眼 */
export function ensureLifeTheme(state: LifeGameState, preferred?: LifeThemeId | 'fate'): LifeThemeId {
  const existing = state.character.flags.life_theme;
  if (isLifeThemeId(existing)) return existing;

  const rng = getRng();
  let id: LifeThemeId;
  if (preferred && preferred !== 'fate' && isLifeThemeId(preferred)) {
    id = preferred;
  } else if (isLifeThemeId(state.character.flags.legacy_theme_echo)) {
    // 來世：六成續寫前世題眼，四成另起
    id = rng.chance(0.6)
      ? (state.character.flags.legacy_theme_echo as LifeThemeId)
      : rng.pick([...LIFE_THEME_IDS]);
  } else {
    id = rng.pick([...LIFE_THEME_IDS]);
  }

  const def = LIFE_THEMES[id];
  state.character.flags.life_theme = id;
  state.character.flags.life_theme_label = def.label;
  state.character.flags.life_theme_vow = def.vow;
  return id;
}

export function themeBias(state: LifeGameState, event: GameEvent): number {
  const theme = getLifeTheme(state);
  const tags = event.tags ?? [];
  let w = 1;
  for (const t of theme.boostTags) {
    if (tags.includes(t)) w *= 1.55;
  }
  for (const t of theme.muteTags) {
    if (tags.includes(t)) w *= 0.45;
  }
  // 題眼關鍵字再輕抬正文／標題
  const blob = `${event.title}${event.body ?? ''}${event.id}`;
  if (theme.id === 'revenge' && /仇|怨|報|宿敵|血債/.test(blob)) w *= 1.4;
  if (theme.id === 'fame' && /名|擂|論劍|傳聞|揚名/.test(blob)) w *= 1.35;
  if (theme.id === 'master' && /師|傳功|秘籍|殘譜|山門/.test(blob)) w *= 1.4;
  if (theme.id === 'wealth' && /銀|當|商|貨|財/.test(blob)) w *= 1.35;
  if (theme.id === 'reclusion' && /靜|避|閑|淡|雨窗/.test(blob)) w *= 1.3;
  if (theme.id === 'clan' && /家|父|母|子|族|歸/.test(blob)) w *= 1.4;
  return w;
}

/** 關路：關閉的路徑大幅降權，開通的抬權 */
export function pathBias(state: LifeGameState, event: GameEvent): number {
  const f = state.character.flags;
  const tags = event.tags ?? [];
  let w = 1;

  const closedCombat = Boolean(f.path_closed_blade);
  const openCombat = Boolean(f.path_open_blade);
  const closedBond = Boolean(f.path_closed_bond);
  const openBond = Boolean(f.path_open_bond);
  const closedDark = Boolean(f.path_closed_dark);
  const openDark = Boolean(f.path_open_dark);
  const closedMarket = Boolean(f.path_closed_market);
  const openMarket = Boolean(f.path_open_market);

  const isCombatish =
    tags.includes('combat') || tags.includes('road') || tags.includes('boss') || /duel|bandit|assassin/.test(event.id);
  const isBondish =
    tags.includes('romance') || tags.includes('family') || tags.includes('bond') || tags.includes('arc');
  const isDarkish =
    tags.includes('pack') ||
    /偷|騙|毒|搶|勒索|滅口|黑|賊/.test(`${event.title}${event.body ?? ''}`);
  const isMarketish =
    tags.includes('economy') || tags.includes('career') || /銀|當|商|市|貨/.test(`${event.title}${event.body ?? ''}`);

  if (closedCombat && isCombatish) w *= 0.2;
  if (openCombat && isCombatish) w *= 1.65;
  if (closedBond && isBondish) w *= 0.25;
  if (openBond && isBondish) w *= 1.55;
  if (closedDark && isDarkish) w *= 0.22;
  if (openDark && isDarkish) w *= 1.7;
  if (closedMarket && isMarketish) w *= 0.3;
  if (openMarket && isMarketish) w *= 1.5;

  return w;
}

/** 心性可見：偏俠／邪／狂／惡改池，唔只改數字 */
export function naturePoolBias(state: LifeGameState, event: GameEvent): number {
  const n = ensureNature(state.character);
  const tags = event.tags ?? [];
  const blob = `${event.title}${event.body ?? ''}`;
  let w = 1;

  if (n.xia >= 28) {
    if (tags.includes('family') || tags.includes('romance') || /助|救|義|護送|調停/.test(blob)) w *= 1.45;
    if (/搶|殺|勒索|欺/.test(blob)) w *= 0.55;
  }
  if (n.xie >= 24) {
    if (isDarkBlob(blob) || tags.includes('economy')) w *= 1.5;
    if (tags.includes('family') || /交還|行善|施捨/.test(blob)) w *= 0.5;
  }
  if (n.kuang >= 26) {
    if (tags.includes('combat') || tags.includes('road') || tags.includes('boss')) w *= 1.5;
    if (tags.includes('ordinary') && !tags.includes('combat')) w *= 0.75;
  }
  if (n.e >= 22) {
    if (tags.includes('combat') || tags.includes('boss') || /威脅|滅|血/.test(blob)) w *= 1.55;
    if (tags.includes('romance') || tags.includes('family')) w *= 0.4;
  }
  return w;
}

function isDarkBlob(blob: string): boolean {
  return /偷|騙|毒|搶|訛|栽贓|陰謀|勒索|滅口/.test(blob);
}

export function varianceWeight(state: LifeGameState, event: GameEvent): number {
  return Math.max(
    0.04,
    themeBias(state, event) * pathBias(state, event) * naturePoolBias(state, event),
  );
}

/**
 * 選擇關路 + 一事一余韻。
 * 回傳可進 deltas／logs 的短句（余韻本身藏 flags，下個月才顯）。
 */
export function applyPathAndEcho(
  state: LifeGameState,
  choiceText: string,
  event: GameEvent,
): { pathLines: string[]; echoSet: boolean } {
  const t = choiceText;
  const f = state.character.flags;
  const pathLines: string[] = [];
  let echoSet = false;

  const open = (key: string, line: string) => {
    if (!f[key]) {
      f[key] = true;
      pathLines.push(line);
    }
  };
  const close = (key: string, line: string) => {
    if (!f[key]) {
      f[key] = true;
      pathLines.push(line);
    }
  };

  if (/戰|拼|衝|對決|比武|硬闖|拔刀|動手|應戰|攔截|殺/.test(t)) {
    open('path_open_blade', '此後刀路漸開，官道上的影子會更密。');
    close('path_closed_bond', '');
    // 硬闖略關溫情路（唔重複刷句）
    if (!f.path_closed_bond_soft) {
      f.path_closed_bond_soft = true;
      f.path_bond_soft_mute = 1;
    }
  }
  if (/助|救|義|讓|保護|護送|調停|交還|施捨|收留|勸/.test(t)) {
    open('path_open_bond', '人情線鬆了一寸，往後較易撞見求援與故人。');
    close('path_closed_dark', '你把黑暗的門掩上了一半。');
  }
  if (/避開|抽身|觀望|退去|不戰|改日|只看|默默|暫時/.test(t)) {
    open('path_open_quiet', '你學會把事推到「下一次」。');
    if (!f.path_closed_blade) {
      // 多次退避才關刀路
      f.path_retreat_count = Number(f.path_retreat_count ?? 0) + 1;
      if (Number(f.path_retreat_count) >= 3) {
        close('path_closed_blade', '刀匣漸生塵——江湖也少找你動手。');
      }
    }
  }
  if (/暗中|偷|騙|毒|陰謀|搶先|佔便宜|訛|欺瞞|栽贓|賣掉線索|撿起包裹/.test(t)) {
    open('path_open_dark', '黑路認得你的腳步了。');
    close('path_closed_bond', '溫情的門難再敲響。');
  }
  if (/買|賣|當|銀|盤纏|護路費|商/.test(t)) {
    open('path_open_market', '算盤聲會跟着你。');
  }
  if (/絕交|疏遠|斷了這段緣/.test(t)) {
    close('path_closed_bond', '你亲手折斷一截緣。');
    open('path_open_blade', '');
  }
  if (/深結此緣|以心相交/.test(t)) {
    open('path_open_bond', '這段緣沉了一寸，往後會再來敲門。');
  }

  // 一事一余韻：寫入下月傳聞，不立刻刷系統句
  const echo = craftEcho(state, t, event);
  if (echo) {
    f.echo_pending = echo;
    f.echo_months = 1;
    echoSet = true;
  }

  return { pathLines: pathLines.filter(Boolean), echoSet };
}

function craftEcho(state: LifeGameState, choiceText: string, event: GameEvent): string | null {
  const theme = getLifeTheme(state);
  const title = (event.tags ?? []).includes('pack') ? '江湖偶遇' : event.title;
  if (/助|救|護送|調停|交還/.test(choiceText)) {
    return `茶棚有人念叨：上次「${title}」裏出手的人，像是你。`;
  }
  if (/戰|硬闖|應戰|拔刀|動手/.test(choiceText)) {
    return theme.id === 'revenge'
      ? `有人說你在「${title}」動了手，刀風像在找誰。`
      : `官道耳語：有人在「${title}」動了刃，步法像你。`;
  }
  if (/偷|騙|搶|訛|賣掉線索|佔便宜/.test(choiceText)) {
    return `夜巷有人笑：懂得在「${title}」取巧的，不止一個——也有你。`;
  }
  if (/避開|抽身|觀望|退去/.test(choiceText)) {
    return `有人記得你在「${title}」停步不前，像把故事撕掉半頁。`;
  }
  if (/深結|絕交|疏遠/.test(choiceText)) {
    return `故人巷口的燈，為「${title}」那一念，明暗都變了。`;
  }
  // 偶發余韻，避免每事都吵
  if (getRng().chance(0.35)) {
    return `風裏還有「${title}」的餘溫，未完全散。`;
  }
  return null;
}

/** 每月開頭取出余韻一句（若有） */
export function takeEchoLine(state: LifeGameState): string | null {
  const f = state.character.flags;
  const echo = typeof f.echo_pending === 'string' ? f.echo_pending : null;
  if (!echo) return null;
  const left = Number(f.echo_months ?? 0) - 1;
  if (left <= 0) {
    delete f.echo_pending;
    delete f.echo_months;
  } else {
    f.echo_months = left;
  }
  return echo;
}

/** 心性改寫事件正文前綴（可見江湖）——確定性，避免重繪疊字 */
export function natureTonePrefix(state: LifeGameState): string | null {
  const n = ensureNature(state.character);
  const dom = dominantNature(state.character);
  if (n[dom] < 22) return null;
  if (dom === 'xia') return '路人看你，眼神裏多半分信任。';
  if (dom === 'xie') return '有人對你笑，笑意卻不到眼底。';
  if (dom === 'kuang') return '風剛一緊，你便覺得該動手了。';
  if (dom === 'e') return '弱者避道，強者盯着你的刃。';
  return null;
}

export function decorateEventBody(state: LifeGameState, body: string | undefined): string {
  const base = (body ?? '').trim();
  const tone = natureTonePrefix(state);
  if (!tone) return base;
  if (base.startsWith(tone)) return base;
  return `${tone}\n\n${base}`;
}

/** 墓誌：題眼 × 心性 句式 */
export function pickVarianceEpitaph(state: LifeGameState): string {
  const theme = getLifeTheme(state);
  const dom = dominantNature(state.character);
  const key = `${theme.id}:${dom}` as const;
  const table: Record<string, string> = {
    'revenge:xia': '　　仇未盡雪，卻仍把刀口朝外。',
    'revenge:xie': '　　報仇報成了手段，名字比仇人更冷。',
    'revenge:kuang': '　　一刃既出，青山也要讓路。',
    'revenge:e': '　　血債還完，人間再無活口可問。',
    'fame:xia': '　　名過酒旗，德未過橋。',
    'fame:xie': '　　名聲是刀，背地裏更利。',
    'fame:kuang': '　　擂台散了，喝彩還在風裏。',
    'fame:e': '　　怕你的人，比敬你的人多。',
    'master:xia': '　　得一真傳，願把火再遞出去。',
    'master:xie': '　　偷師半生，終究還是自己的路。',
    'master:kuang': '　　拳腳未收，師門燈已滅。',
    'master:e': '　　秘籍在手，同門已成路人。',
    'wealth:xia': '　　銀兩散盡，帳本寫着助人。',
    'wealth:xie': '　　算盤響過刀鳴，匣滿心空。',
    'wealth:kuang': '　　豪賭一場，贏得起，也輸得起。',
    'wealth:e': '　　財聚人散，青石不認帳。',
    'reclusion:xia': '　　避世而未棄世，橋下仍有人記得。',
    'reclusion:xie': '　　躲進暗處，暗處也躲進你。',
    'reclusion:kuang': '　　想靜，拳腳卻不肯靜。',
    'reclusion:e': '　　閉門之後，門外再無活聲。',
    'clan:xia': '　　家門未斷，燈火有人續。',
    'clan:xie': '　　族產在，人心散。',
    'clan:kuang': '　　為護族，刀比家規更快。',
    'clan:e': '　　族譜寫滿你的名，也寫滿別人的血。',
  };
  return table[key] ?? `　　題眼「${theme.label}」未盡，卷先合上。`;
}

export function themeHintLine(state: LifeGameState): string {
  const theme = getLifeTheme(state);
  return `題眼·${theme.label}：${theme.vow}`;
}

export function preferredArcIds(state: LifeGameState): string[] {
  return getLifeTheme(state).preferArcIds ?? [];
}

/** 傳承劇本：來世專屬開場事件需求旗 */
export function scheduleLegacyScripts(state: LifeGameState): void {
  const f = state.character.flags;
  if (f.born_with_rival_hint) f.legacy_script_rival = true;
  if (f.born_with_friend_hint) f.legacy_script_friend = true;
  if (f.born_with_gear_dream) f.legacy_script_gear = true;
  if (f.legacy_theme_echo) f.legacy_script_theme = true;
}

export function buildLegacyScriptEvent(state: LifeGameState): GameEvent | null {
  const f = state.character.flags;
  const months = state.character.stats.monthsLived ?? 0;
  // 來世前半年內插入專屬頁
  if (months > 8) return null;

  if (f.legacy_script_rival && !f.done_legacy_script_rival) {
    const foe = String(f.born_with_rival_hint ?? '舊仇');
    return {
      id: 'legacy_script_rival',
      title: '舊怨叩門',
      body: `鎮口有人攔路，袖口繡着生疏的家紋。他盯着你許久，才吐出兩個字：「${foe}。」\n你沒有見過這張臉，卻覺得刀疤的位置，像夢裏重複畫過。`,
      weight: 80,
      tags: ['story', 'legacy', 'combat'],
      choices: [
        {
          id: 'draw',
          text: '拔刀問清楚',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: `刀光一碰，舊怨便不再是傳聞。你把「${foe}」三字刻進了自己的題眼。` },
                { type: 'flag', key: 'path_open_blade', value: true },
                { type: 'flag', key: 'done_legacy_script_rival', value: true },
                { type: 'flag', key: 'legacy_script_rival', value: false },
                { type: 'nature', delta: { kuang: 2 } },
              ],
            },
          ],
        },
        {
          id: 'ask',
          text: '先問來歷，再定恩怨',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: `他冷笑：「來世還裝糊塗？」話未完，雨已斜。你把這段緣記進年譜，沒有立刻動手。` },
                { type: 'flag', key: 'path_open_bond', value: true },
                { type: 'flag', key: 'done_legacy_script_rival', value: true },
                { type: 'flag', key: 'legacy_script_rival', value: false },
                { type: 'nature', delta: { xia: 1 } },
              ],
            },
          ],
        },
        {
          id: 'leave',
          text: '轉身入雨，當沒聽過',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: `你走進雨幕。背後那人沒追，只把「${foe}」三字又唸了一遍——像在警告來世。` },
                { type: 'flag', key: 'path_closed_blade', value: false },
                { type: 'flag', key: 'echo_pending', value: `雨夜又有人提起「${foe}」，像不肯散。` },
                { type: 'flag', key: 'echo_months', value: 2 },
                { type: 'flag', key: 'done_legacy_script_rival', value: true },
                { type: 'flag', key: 'legacy_script_rival', value: false },
              ],
            },
          ],
        },
      ],
    };
  }

  if (f.legacy_script_friend && !f.done_legacy_script_friend) {
    return {
      id: 'legacy_script_friend',
      title: '故人拱手',
      body: '茶棚角落有人朝你一拱手，神情熟得不像初見。他說：「夢裡約過，醒來該認。」',
      weight: 70,
      tags: ['story', 'legacy', 'bond'],
      choices: [
        {
          id: 'accept',
          text: '以茶代酒，認這聲故人',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: '茶溫過手，你覺得有些路不必一個人走。' },
                { type: 'flag', key: 'path_open_bond', value: true },
                { type: 'flag', key: 'done_legacy_script_friend', value: true },
                { type: 'flag', key: 'legacy_script_friend', value: false },
                { type: 'nature', delta: { xia: 2 } },
              ],
            },
          ],
        },
        {
          id: 'doubt',
          text: '只點頭，不深交',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: '你把人情壓在舌底。他也不惱，只說：「來日橋上見。」' },
                { type: 'flag', key: 'done_legacy_script_friend', value: true },
                { type: 'flag', key: 'legacy_script_friend', value: false },
              ],
            },
          ],
        },
      ],
    };
  }

  if (f.legacy_script_gear && !f.done_legacy_script_gear) {
    const raw = String(f.born_with_gear_dream ?? '舊兵刃');
    const gear = displayGearName(raw);
    return {
      id: 'legacy_script_gear',
      title: '夢器有影',
      body: `當鋪櫃上斜靠一件物什，你說不上名字，掌心卻先涼了——活像夢裡那「${gear}」。`,
      weight: 65,
      tags: ['story', 'legacy'],
      choices: [
        {
          id: 'redeem',
          text: '傾囊贖回',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: '銀兩換涼意。你握着它，忽然明白前世為何走不遠。' },
                { type: 'money', amount: -30 },
                { type: 'flag', key: 'done_legacy_script_gear', value: true },
                { type: 'flag', key: 'legacy_script_gear', value: false },
                { type: 'martial', amount: 2 },
              ],
            },
          ],
        },
        {
          id: 'touch',
          text: '只摸一摸便走',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: '指尖一觸，舊夢碎成半句。你沒買下它，卻把它寫進了題眼。' },
                { type: 'flag', key: 'done_legacy_script_gear', value: true },
                { type: 'flag', key: 'legacy_script_gear', value: false },
                { type: 'flag', key: 'echo_pending', value: '當鋪那件物什，夜里又入夢。' },
                { type: 'flag', key: 'echo_months', value: 2 },
              ],
            },
          ],
        },
      ],
    };
  }

  if (f.legacy_script_theme && !f.done_legacy_script_theme && isLifeThemeId(f.legacy_theme_echo)) {
    const echoTheme = LIFE_THEMES[f.legacy_theme_echo as LifeThemeId];
    return {
      id: 'legacy_script_theme',
      title: '題眼未散',
      body: `族譜夾頁寫着前世一句話：「${echoTheme.vow}」墨跡未乾，像在問你還認不認。`,
      weight: 60,
      tags: ['story', 'legacy'],
      choices: [
        {
          id: 'continue',
          text: '續寫這句題眼',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: `你把「${echoTheme.label}」重新蓋進自己的卷首。` },
                { type: 'flag', key: 'life_theme', value: echoTheme.id },
                { type: 'flag', key: 'life_theme_label', value: echoTheme.label },
                { type: 'flag', key: 'life_theme_vow', value: echoTheme.vow },
                { type: 'flag', key: 'done_legacy_script_theme', value: true },
                { type: 'flag', key: 'legacy_script_theme', value: false },
              ],
            },
          ],
        },
        {
          id: 'break',
          text: '撕掉，另起題眼',
          outcomes: [
            {
              effects: [
                { type: 'narrate', text: '紙碎了。你決定這一世不再替前人還願。' },
                { type: 'flag', key: 'done_legacy_script_theme', value: true },
                { type: 'flag', key: 'legacy_script_theme', value: false },
                { type: 'nature', delta: { kuang: 1 } },
              ],
            },
          ],
        },
      ],
    };
  }

  return null;
}

export function natureVisibleHint(state: LifeGameState): string | null {
  const n = ensureNature(state.character);
  const dom = dominantNature(state.character);
  if (n[dom] < 24) return null;
  const label = natureLabels[dom as NatureAttr];
  if (dom === 'xia') return `心性偏「${label}」：求助與義舉較易找上你。`;
  if (dom === 'xie') return `心性偏「${label}」：黑市耳語、狡計路遇較密。`;
  if (dom === 'kuang') return `心性偏「${label}」：約戰與官道刀影較近。`;
  if (dom === 'e') return `心性偏「${label}」：溫情門路漸少，血腥事漸多。`;
  return null;
}
