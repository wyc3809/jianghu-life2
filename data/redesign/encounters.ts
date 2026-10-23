/**
 * 在線奇遇（design/agreed-design-2026-10.md §3.3）。
 * 玩家決定（2026-10-05）：每星期約 2–3 次、只喺在線時彈；揀咗第一個決定先開始計 1–3 日；
 * 考驗用遊戲內進度達成（尋人＝過月、收集＝賺銀兩（任何來源嘅銀兩增加都計）、比試＝演武台過關／打贏交手）；
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
  harvest: { verb: '賺取銀兩', unit: '兩' },
  stages: { verb: '演武台再過', unit: '關' },
  wins: { verb: '交手獲勝', unit: '場' },
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
        label: '奉上乾糧，聽他說明',
        story: '老僧吃罷，寫下一個地名：「去找我師弟，他會傳你武功。」',
        trialName: '尋人',
        trial: 'months',
        target: 3,
        days: 3,
      },
      {
        id: 'spar',
        label: '「大師手上功夫，可否賜教？」',
        story: '老僧大笑：「先勝過我徒兒，再來向我請教。」',
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
    story: '雷雨夜，一名女子來到客棧門外，全身濕透，背上負著一隻油布長匣。',
    routes: [
      {
        id: 'shelter',
        label: '讓位供她避雨',
        story: '她說匣中是亡夫遺物，尚缺盤纏，無法送回師門。',
        trialName: '收集',
        trial: 'harvest',
        target: 120,
        days: 3,
      },
      {
        id: 'escort',
        label: '「我護你一程。」',
        story: '途中追兵攔路。她拔刀道：「助我退敵，匣中之物分你一半。」',
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
    story: '山腳下，一名老人揮拳擊石，拳拳入石。他未曾抬頭，只問：「年輕人，看夠了嗎？」',
    routes: [
      {
        id: 'learn',
        label: '跪地求教',
        story: '「想學武功？先幫我找回走失的孫兒。」',
        trialName: '尋人',
        trial: 'months',
        target: 4,
        days: 3,
      },
      {
        id: 'challenge',
        label: '「讓我一試。」',
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
    story: '一名孩童從濃霧中走出，擦身而過時取走你的錢袋。你轉身追趕，他已隱入霧中。',
    routes: [
      {
        id: 'chase',
        label: '追！',
        story: '霧散後，孩童坐在樹上：「追得上我，便教你身法。不過我餓了，先備些吃食。」',
        trialName: '收集',
        trial: 'harvest',
        target: 150,
        days: 2,
      },
      {
        id: 'wait',
        label: '原地等候',
        story: '孩童回來歸還錢袋：「倒有幾分定力。下個月再來找我。」',
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
    story: '崖邊一人踏霧而行，一步便越過十丈山隙。他回頭看你一眼，停在對岸。',
    routes: [
      {
        id: 'follow',
        label: '循足跡追尋',
        story: '足跡止於崖邊，石上刻著一行字：「三月後再來。」',
        trialName: '尋人',
        trial: 'months',
        target: 3,
        days: 3,
      },
      {
        id: 'call',
        label: '大叫：「前輩留步！」',
        story: '對岸傳來聲音：「先接住我徒弟一招，再來見我。」',
        trialName: '比試',
        trial: 'wins',
        target: 1,
        days: 2,
      },
    ],
    rewards: ['pr_cloud_step', 'pr_shadow_flash', 'pr_tide_step', 'pr_void_breath'],
  },
];
