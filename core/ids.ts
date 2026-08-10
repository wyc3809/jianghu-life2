import { getRng } from './random';

let idCounter = 0;

function nextSuffix(): string {
  idCounter += 1;
  return idCounter.toString(36).padStart(6, '0');
}

export function resetIdCounter(n = 0): void {
  idCounter = n;
}

export const ids = {
  character: () => `CHR_${nextSuffix()}`,
  city: () => `CITY_${nextSuffix()}`,
  faction: () => `FAC_${nextSuffix()}`,
  item: () => `ITM_${nextSuffix()}`,
  skill: () => `SKL_${nextSuffix()}`,
  quest: () => `QST_${nextSuffix()}`,
  rumor: () => `RMR_${nextSuffix()}`,
  event: () => `EVT_${nextSuffix()}`,
  history: () => `HIS_${nextSuffix()}`,
  memory: () => `MEM_${nextSuffix()}`,
};

/** 常用單姓（族譜對齊時辨識「已有姓」） */
export const CHINESE_SURNAMES = [
  '李',
  '王',
  '張',
  '劉',
  '陳',
  '楊',
  '趙',
  '黃',
  '周',
  '吳',
  '徐',
  '孫',
  '馬',
  '朱',
  '胡',
  '林',
  '郭',
  '何',
  '高',
  '羅',
  '蔣',
  '沈',
  '陸',
  '岳',
] as const;

const GIVEN_NAMES = [
  '無名',
  '青雲',
  '秋水',
  '長風',
  '明月',
  '鐵手',
  '如雪',
  '天涯',
  '孤鴻',
  '凌霄',
  '忘機',
  '承影',
  '聽雨',
  '斷浪',
  '問天',
  '潤天',
  '雲龍',
] as const;

export function chineseSurnameOf(fullName: string): string {
  const n = fullName.trim();
  return n[0] ?? '李';
}

export function randomChineseGivenName(): string {
  return getRng().pick([...GIVEN_NAMES]);
}

export function randomChineseSurname(): string {
  return getRng().pick([...CHINESE_SURNAMES]);
}

/**
 * 把名字改成指定姓：已同姓則保留；若首字是常見姓則換姓留名；
 * 否則視為只有名，直接冠姓（如「青禾」→「蔣青禾」）。
 */
export function withChineseSurname(surname: string, name: string): string {
  const s = (surname.trim()[0] ?? '李') as string;
  const trimmed = name.trim();
  if (!trimmed) return s + randomChineseGivenName();
  if (trimmed.startsWith(s)) return trimmed;
  const head = trimmed[0]!;
  if ((CHINESE_SURNAMES as readonly string[]).includes(head) && trimmed.length >= 2) {
    return s + trimmed.slice(1);
  }
  return s + trimmed;
}

/** @param surname 若給定，整名用此姓 + 隨機名 */
export function randomChineseName(surname?: string): string {
  const rng = getRng();
  const s = surname?.trim()[0] || rng.pick([...CHINESE_SURNAMES]);
  return s + rng.pick([...GIVEN_NAMES]);
}
