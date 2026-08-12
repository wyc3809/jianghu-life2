import type { NatureAttr, WuxiaAttribute } from '@interfaces/lifeEngine';
import type { LifeThemeId } from './lifeVariance';
import { LIFE_THEME_IDS } from './lifeVariance';

export type OriginAttrDelta = Partial<Record<WuxiaAttribute, number>>;
export type OriginNatureDelta = Partial<Record<NatureAttr, number>>;
export type OriginThemeWeight = Partial<Record<LifeThemeId, number>>;

export type OriginChoice = {
  id: string;
  text: string;
  /** 出生屬性微調（開局後套用） */
  attributes?: OriginAttrDelta;
  /** 心性微調 */
  nature?: OriginNatureDelta;
  /** 題眼傾向計分 */
  themeWeights?: OriginThemeWeight;
  /** 寫入年譜的一句 */
  log: string;
};

export type OriginEvent = {
  id: string;
  title: string;
  body: string;
  choices: [OriginChoice, OriginChoice, ...OriginChoice[]];
};

/** 開局前三頁：少年往事 → 影響屬性／心性／題眼 */
export const ORIGIN_EVENTS: OriginEvent[] = [
  {
    id: 'origin_alley',
    title: '巷口一劫',
    body: '十四歲那年，巷口有人搶走鄰家老人的藥包。你剛從私塾回來，書包還未放下。',
    choices: [
      {
        id: 'chase',
        text: '追上去搶回來',
        attributes: { danShi: 4, genGu: 2 },
        nature: { xia: 4, kuang: 2 },
        themeWeights: { revenge: 2, fame: 1, master: 1 },
        log: '巷口追賊，膽識漸開。',
      },
      {
        id: 'shout',
        text: '高聲喊人來幫',
        attributes: { meiLi: 3, fuYuan: 2 },
        nature: { xia: 2 },
        themeWeights: { clan: 2, fame: 1 },
        log: '你喊動左鄰右舍，人情比拳腳先到。',
      },
      {
        id: 'hide',
        text: '先躲過鋒芒',
        attributes: { wuXing: 3, fuYuan: 1 },
        nature: { xie: 2 },
        themeWeights: { reclusion: 2, wealth: 1 },
        log: '你看清了风向才動，從此少與人硬碰。',
      },
    ],
  },
  {
    id: 'origin_guest',
    title: '門前異客',
    body: '十五歲秋，有異客在你家門前歇腳，說要指點一式半招，也願用銀兩換一夜茶飯。',
    choices: [
      {
        id: 'learn',
        text: '請他教一招',
        attributes: { wuXing: 4, genGu: 2 },
        nature: { kuang: 1, xia: 1 },
        themeWeights: { master: 3, fame: 1 },
        log: '異客指點一招，悟性如開窗。',
      },
      {
        id: 'coin',
        text: '收下銀兩款待',
        attributes: { fuYuan: 3, meiLi: 2 },
        nature: { xie: 1 },
        themeWeights: { wealth: 3, clan: 1 },
        log: '你把人情換成銀兩，算盤聲比刀聲先響。',
      },
      {
        id: 'refuse',
        text: '婉拒，請他另投',
        attributes: { danShi: 1 },
        nature: { xia: 1 },
        themeWeights: { reclusion: 2, clan: 1 },
        log: '你守着門楣，不輕易引人入室。',
      },
    ],
  },
  {
    id: 'origin_vow',
    title: '辭鎮夜話',
    body: '十六歲將出鎮。燈下，你對自己說了一句話——往後的江湖，多半繞着這句轉。',
    choices: [
      {
        id: 'vow_blade',
        text: '「此生要了結一樁事。」',
        attributes: { danShi: 3, genGu: 2 },
        nature: { kuang: 2, e: 1 },
        themeWeights: { revenge: 4 },
        log: '辭鎮時立誓了結舊怨。',
      },
      {
        id: 'vow_name',
        text: '「要讓名字響過酒旗。」',
        attributes: { meiLi: 3, wuXing: 2 },
        nature: { kuang: 2, xia: 1 },
        themeWeights: { fame: 4 },
        log: '你把名望寫進出鎮的第一步。',
      },
      {
        id: 'vow_master',
        text: '「要找一個肯教真功夫的人。」',
        attributes: { wuXing: 3, genGu: 3 },
        nature: { xia: 2 },
        themeWeights: { master: 4 },
        log: '拜師之意，比行囊更重。',
      },
      {
        id: 'vow_coin',
        text: '「銀兩進匣，比刀快。」',
        attributes: { fuYuan: 4, meiLi: 1 },
        nature: { xie: 2 },
        themeWeights: { wealth: 4 },
        log: '你算定盤，不算定生死。',
      },
      {
        id: 'vow_quiet',
        text: '「能躲過江湖最好。」',
        attributes: { fuYuan: 2, wuXing: 1 },
        nature: { xie: 1 },
        themeWeights: { reclusion: 4 },
        log: '你願以安靜換平安。',
      },
      {
        id: 'vow_clan',
        text: '「家門不能斷在自己手上。」',
        attributes: { meiLi: 2, fuYuan: 2, genGu: 1 },
        nature: { xia: 3 },
        themeWeights: { clan: 4 },
        log: '你把族譜放進行囊最貼身處。',
      },
    ],
  },
];

export type OriginPick = {
  eventId: string;
  choiceId: string;
};

export type OriginResult = {
  attributes: OriginAttrDelta;
  nature: OriginNatureDelta;
  lifeTheme: LifeThemeId;
  chronicle: string[];
};

function addPartial<T extends string>(
  into: Partial<Record<T, number>>,
  delta?: Partial<Record<T, number>>,
): void {
  if (!delta) return;
  for (const [k, v] of Object.entries(delta) as [T, number | undefined][]) {
    if (typeof v !== 'number' || !v) continue;
    into[k] = (into[k] ?? 0) + v;
  }
}

/** 把已選頁面結算成開局加成與題眼 */
export function resolveOriginPicks(picks: OriginPick[]): OriginResult {
  const attributes: OriginAttrDelta = {};
  const nature: OriginNatureDelta = {};
  const themeScore: Partial<Record<LifeThemeId, number>> = {};
  const chronicle: string[] = [];

  for (const pick of picks) {
    const ev = ORIGIN_EVENTS.find((e) => e.id === pick.eventId);
    const ch = ev?.choices.find((c) => c.id === pick.choiceId);
    if (!ev || !ch) continue;
    addPartial(attributes, ch.attributes);
    addPartial(nature, ch.nature);
    addPartial(themeScore, ch.themeWeights);
    chronicle.push(`【少時·${ev.title}】${ch.log}`);
  }

  let best: LifeThemeId = 'fame';
  let bestScore = -1;
  for (const id of LIFE_THEME_IDS) {
    const s = themeScore[id] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }

  return { attributes, nature, lifeTheme: best, chronicle };
}

export function originRoundLabel(index: number): string {
  return `少時往事 · 第 ${index + 1}/${ORIGIN_EVENTS.length} 頁`;
}
