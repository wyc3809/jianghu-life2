import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { applyLearnMartialArt } from './flavor';

export type ArtId =
  | 'guqin'
  | 'weiqi'
  | 'poetry'
  | 'painting'
  | 'buddhism'
  | 'daoism'
  | 'darkArts';

export interface ArtDef {
  id: ArtId;
  name: string;
  hint: string;
  flagKey: string;
  masterySkillId: string;
  masteryFlavor: string;
  studyLines: string[];
}

/** 練到此熟練度即悟得對應武功／效果，與「把酒買醉→醉八仙拳」同一門檻量級 */
export const ART_MASTERY_THRESHOLD = 30;

/** 桃花島門檻：琴棋詩書畫（傳統「琴棋書畫」對應嘅 4 種）熟練度總和 */
export const TAOHUA_CULTURE_ARTS: ArtId[] = ['guqin', 'weiqi', 'poetry', 'painting'];
export const TAOHUA_CULTURE_THRESHOLD = 60;

export const ART_DEFS: ArtDef[] = [
  {
    id: 'guqin',
    name: '古琴',
    hint: '撫琴養性，深造可悟內功',
    flagKey: 'art_guqin',
    masterySkillId: 'art_guqin_song',
    masteryFlavor: '你撫琴一曲，餘音繞樑，竟悟出「廣陵絕響」的心法！',
    studyLines: [
      '你撫琴一曲，指法漸趨圓熟。',
      '夜深撫琴，琴音散入江風，心緒也靜了幾分。',
      '一曲未終，弦上指法又精進一層。',
    ],
  },
  {
    id: 'weiqi',
    name: '圍棋',
    hint: '推演棋局，深造可悟招式',
    flagKey: 'art_weiqi',
    masterySkillId: 'art_weiqi_trap',
    masteryFlavor: '一局棋終，你忽然看穿了招式與棋路相通之處，悟出「珍瓏棋局」！',
    studyLines: [
      '你獨自擺譜推演，棋力又長了幾分。',
      '與人對弈一局，雖勝負難分，棋路卻清明不少。',
      '棋盤黑白縱橫，你在其中看出幾分門道。',
    ],
  },
  {
    id: 'poetry',
    name: '詩書',
    hint: '研讀詩文，深造可悟劍意',
    flagKey: 'art_poetry',
    masterySkillId: 'art_poetry_sword',
    masteryFlavor: '讀罷詩卷，你忽有所感，劍意竟隨詩句流轉，悟出「詩劍風流」！',
    studyLines: [
      '你研讀詩文，字句入心，倒也怡然。',
      '燈下讀書至夜半，胸中墨氣又厚了幾分。',
      '一卷詩集讀罷，你提筆試寫，字裡有了幾分自己的味道。',
    ],
  },
  {
    id: 'painting',
    name: '繪畫',
    hint: '潑墨作畫，深造可悟身法',
    flagKey: 'art_painting',
    masterySkillId: 'art_ink_illusion',
    masteryFlavor: '筆走龍蛇，墨跡未乾，你的身形竟也隨之飄忽難測，悟出「潑墨迷蹤」！',
    studyLines: [
      '你鋪紙研墨，畫技又精進一分。',
      '一幅山水畫成，筆法漸有自家氣象。',
      '潑墨揮毫，墨色濃淡間，你也悟出幾分虛實之道。',
    ],
  },
  {
    id: 'buddhism',
    name: '佛法',
    hint: '參禪禮佛，深造可悟護體心法',
    flagKey: 'art_buddhism',
    masterySkillId: 'art_buddha_heart',
    masteryFlavor: '參禪日久，心境澄明如鏡，體魄竟隨之堅實，悟出「金剛不壞」！',
    studyLines: [
      '你靜坐參禪，心緒漸漸澄明。',
      '誦經一卷，雜念散去不少。',
      '禮佛之餘，你對生死看得更淡了幾分。',
    ],
  },
  {
    id: 'daoism',
    name: '道法',
    hint: '修習道經，深造可悟吐納之術',
    flagKey: 'art_daoism',
    masterySkillId: 'art_dao_breath',
    masteryFlavor: '道經讀罷，你依法吐納，內息竟綿長不絕，悟出「太乙玄清」！',
    studyLines: [
      '你研讀道經，依樣吐納，氣息略見綿長。',
      '打坐調息一夜，胸中一口濁氣散了大半。',
      '道法自然四字，你漸漸咂摸出幾分滋味。',
    ],
  },
  {
    id: 'darkArts',
    name: '邪學',
    hint: '鑽研旁門，深造可悟邪功——唯心性夠狠者敢學',
    flagKey: 'art_darkArts',
    masterySkillId: 'art_heretic_scripture',
    masteryFlavor: '邪典讀罷，你依法煉功，狠辣招式竟自成一路，悟出「天魔邪功」！',
    studyLines: [
      '你翻閱旁門邪典，心中暗自驚駭，卻又忍不住多看幾頁。',
      '依邪典所載煉功一夜，氣息隱隱有異，你卻不以為意。',
      '邪學不容於正道，你關起門來，獨自鑽研。',
    ],
  },
];

export function getArtDef(id: string): ArtDef | undefined {
  return ART_DEFS.find((a) => a.id === id);
}

export function artProficiency(state: LifeGameState, artId: string): number {
  const def = getArtDef(artId);
  if (!def) return 0;
  return Math.max(0, Number(state.character.flags[def.flagKey] ?? 0));
}

/** 桃花島門檻：琴棋詩書畫熟練度總和是否達標 */
export function meetsTaohuaCultureGate(state: LifeGameState): boolean {
  const total = TAOHUA_CULTURE_ARTS.reduce((sum, id) => sum + artProficiency(state, id), 0);
  return total >= TAOHUA_CULTURE_THRESHOLD;
}

/** 進修一次雅藝：累加熟練度，達門檻時悟得對應武功 */
export function applyStudyArt(state: LifeGameState, artId: string): string[] {
  const def = getArtDef(artId);
  if (!def) return ['你尚未選定要修習的雅藝。'];
  const c = state.character;
  const rng = getRng();
  const count = artProficiency(state, artId) + 1;
  c.flags[def.flagKey] = count;
  const logs: string[] = [rng.pick(def.studyLines), `${def.name}熟練度：${count}`];
  if (count >= ART_MASTERY_THRESHOLD && !c.skills.includes(def.masterySkillId)) {
    const learned = applyLearnMartialArt(state, def.masterySkillId);
    logs.push(def.masteryFlavor);
    logs.push(learned.story);
    if (learned.delta) logs.push(learned.delta);
    logs.push(...learned.achievements);
  }
  return logs;
}
