/**
 * 在線奇遇（design/agreed-design-2026-10.md §3.3）。
 * 玩家決定（2026-10-05）：每星期約 2–3 次、只喺在線時彈；揀咗第一個決定先開始計 1–3 日；
 * 考驗用遊戲內進度達成（尋人＝過月、收集＝收成銀兩、比試＝演武台過關／打贏交手）；
 * 過期乜都冇；離線時間照計。
 *
 * ⚠ 故事、路線、考驗目標、期限、獎勵範圍屬**測試參數**，玩家睇圖後可改。
 */

/** 兩次奇遇之間（真實時間）：56–84 小時＝每星期約 2–3 次 */
export const ENCOUNTER_GAP_MIN_HOURS = 56;
export const ENCOUNTER_GAP_MAX_HOURS = 84;
/** 新帳戶第一次：在線 10 分鐘後 */
export const ENCOUNTER_FIRST_DELAY_MINUTES = 10;
/** 彈出之後幾耐唔揀就散（未開始計限期） */
export const ENCOUNTER_OFFER_HOURS = 24;

export type TrialKind = 'months' | 'harvest' | 'stages' | 'wins';

export const TRIAL_LABEL: Record<TrialKind, { verb: string; unit: string }> = {
  months: { verb: '過月', unit: '個月' },
  harvest: { verb: '收成銀兩', unit: '兩' },
  stages: { verb: '演武台再過', unit: '關' },
  wins: { verb: '交手打贏', unit: '場' },
};

export interface EncounterRoute {
  id: string;
  label: string;
  /** 揀咗之後講乜 */
  story: string;
  /** 考驗：尋人／收集／比試 */
  trialName: string;
  trial: TrialKind;
  target: number;
  /** 限期（日，1–3） */
  days: number;
}

export interface EncounterTemplate {
  id: string;
  title: string;
  story: string;
  routes: EncounterRoute[];
  /** 完成後由呢啲珍本奇功入面揀一門（優先未有嘅） */
  rewards: string[];
}

export const ENCOUNTERS: EncounterTemplate[] = [
  {
    id: 'enc_blood_monk',
    title: '血衣僧',
    story: '破廟簷下，一個血衣老僧咳着血，指你懷中乾糧：「施主，借一口飯，換一句話。」',
    routes: [
      {
        id: 'feed',
        label: '奉上乾糧，聽佢講',
        story: '老僧吃罷，寫低一個地名：「去搵我師弟，佢會教你。」',
        trialName: '尋人',
        trial: 'months',
        target: 3,
        days: 3,
      },
      {
        id: 'spar',
        label: '「大師手上功夫，可否賜教？」',
        story: '老僧大笑：「先過得我徒兒幾關再講。」',
        trialName: '比試',
        trial: 'stages',
        target: 5,
        days: 2,
      },
    ],
    rewards: ['pr_blood_lotus', 'pr_crimson_moon', 'pr_blood_sea'],
  },
  {
    id: 'enc_thunder_widow',
    title: '雷雨夜客',
    story: '雷雨夜，客棧門外有個濕透嘅女子，背住一個用油布包好嘅長匣。',
    routes: [
      {
        id: 'shelter',
        label: '讓位畀佢避雨',
        story: '佢話匣入面係亡夫遺物，要湊夠盤川先送得返師門。',
        trialName: '收集',
        trial: 'harvest',
        target: 120,
        days: 3,
      },
      {
        id: 'escort',
        label: '「我護你一程。」',
        story: '半路殺出追兵——佢冷冷一句：「打贏佢，匣入面嘅嘢歸你一半。」',
        trialName: '比試',
        trial: 'wins',
        target: 1,
        days: 1,
      },
    ],
    rewards: ['pr_nine_chain', 'pr_wind_thread', 'pr_thunder_heart', 'pr_star_fall'],
  },
  {
    id: 'enc_iron_mountain',
    title: '鐵山老人',
    story: '山腳有個老人用拳頭打石，一拳一個坑。佢頭都唔抬：「後生，睇夠未？」',
    routes: [
      {
        id: 'learn',
        label: '跪低求教',
        story: '「求我？先幫我搵返走失咗嘅孫仔。」',
        trialName: '尋人',
        trial: 'months',
        target: 4,
        days: 3,
      },
      {
        id: 'challenge',
        label: '「我都試吓。」',
        story: '老人終於抬頭：「好，演武台見真章。」',
        trialName: '比試',
        trial: 'stages',
        target: 8,
        days: 2,
      },
    ],
    rewards: ['pr_mountain_split', 'pr_heaven_spear', 'pr_diamond_body', 'pr_vajra_palm'],
  },
  {
    id: 'enc_mist_child',
    title: '霧中孩童',
    story: '濃霧入面有個細路行出嚟，手一伸你錢袋已經唔見咗——佢笑住消失喺霧中。',
    routes: [
      {
        id: 'chase',
        label: '追！',
        story: '霧散時佢坐喺樹上：「追到我就教你，但我餓喇。」',
        trialName: '收集',
        trial: 'harvest',
        target: 150,
        days: 2,
      },
      {
        id: 'wait',
        label: '原地等佢返嚟',
        story: '細路果然返嚟還錢袋：「你夠定力。下個月再嚟搵我。」',
        trialName: '尋人',
        trial: 'months',
        target: 2,
        days: 1,
      },
    ],
    rewards: ['pr_mist_blind', 'pr_soul_lock', 'pr_seal_meridian', 'pr_floating_blade'],
  },
  {
    id: 'enc_cloud_hermit',
    title: '踏雲隱者',
    story: '你喺崖邊見到一個人行喺雲上，一步十丈，回頭望你一眼。',
    routes: [
      {
        id: 'follow',
        label: '跟住佢嘅腳印',
        story: '腳印去到懸崖邊就斷咗，旁邊刻住一行字：「三月後再嚟。」',
        trialName: '尋人',
        trial: 'months',
        target: 3,
        days: 3,
      },
      {
        id: 'call',
        label: '大叫：「前輩留步！」',
        story: '雲上傳來一句：「接得住我徒弟一招先講。」',
        trialName: '比試',
        trial: 'wins',
        target: 1,
        days: 2,
      },
    ],
    rewards: ['pr_cloud_step', 'pr_shadow_flash', 'pr_tide_step', 'pr_void_breath'],
  },
];
