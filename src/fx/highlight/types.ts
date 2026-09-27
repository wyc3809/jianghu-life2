/**
 * 高光時刻（3D 結算演出）設定型別。
 * 三個主體：寶箱（裝備掉落）、令牌（武學）、丹爐（境界突破）；六級品階色（grades.ts）。
 */

export type HighlightSubject = 'chest' | 'token' | 'cauldron';

/** 0 普通白 · 1 精良綠 · 2 稀有藍 · 3 史詩紫 · 4 傳說橙 · 5 神話紅 */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

/** 2D 卡面圖示種類（icons.ts 逐個畫，有自己表情同姿態） */
export type IconKind =
  | 'sword'
  | 'blade'
  | 'spear'
  | 'staff'
  | 'whip'
  | 'bow'
  | 'hidden'
  | 'armor'
  | 'accessory'
  | 'scroll'
  | 'pill'
  | 'coin'
  | 'gem';

/** 卡面背景圖案（按屬性分） */
export type CardPattern = 'blade' | 'guard' | 'charm' | 'art' | 'elixir' | 'wealth';

export interface RewardStat {
  label: string;
  /** 揭曉時由 from 滾到 to，彈「▲+差值」 */
  from: number;
  to: number;
}

export interface RewardCard {
  id: string;
  icon: IconKind;
  pattern: CardPattern;
  name: string;
  /** 卡面品階（決定框同鑲嵌件） */
  grade: Grade;
  /** 卡面大字數量（例如 ×120）；細字數值唔放卡面 */
  amount?: number;
  isNew?: boolean;
  /** 揭曉資訊面板用 */
  stats?: RewardStat[];
  /** 面板一句描述 */
  blurb?: string;
  /** 領取時飛入 HUD 邊個餘額（金幣／寶石），冇就唔飛 */
  flyTo?: 'coin' | 'gem';
}

export interface Balance {
  label: string;
  value: number;
}

export interface HighlightConfig {
  subject: HighlightSubject;
  /** 升級終點（點擊次數＝targetGrade，由 0 開始爬） */
  targetGrade: Grade;
  /** 每級標題（index＝grade）；冇就用品階名 */
  titles?: Partial<Record<Grade, string>>;
  /** 揭曉後大標題 */
  revealTitle: string;
  /** 標題下一行 */
  revealSub?: string;
  /** 揭曉時蓋嘅詞語印（印鍵，見 src/ui/inkAssets.ts） */
  seal?: string;
  rewards: RewardCard[];
  /** HUD 餘額 */
  balances: { coin: Balance; gem: Balance };
}
