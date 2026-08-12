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

/** 偏女性化名字（母親／眷屬用） */
export const FEMININE_GIVEN_NAMES = [
  '阿絮',
  '如雪',
  '聽雨',
  '青禾',
  '墨白',
  '綿綿',
  '念慈',
  '素心',
  '晚棠',
  '雲袖',
  '柔枝',
  '清寧',
  '映月',
  '佩蘭',
  '小滿',
  '靜姝',
] as const;

export function randomChineseFeminineGivenName(): string {
  return getRng().pick([...FEMININE_GIVEN_NAMES]);
}

/** 母系外姓：避開本支姓 */
export function randomMaidenSurname(exclude: string): string {
  const rng = getRng();
  const ex = exclude.trim()[0] ?? '';
  const pool = CHINESE_SURNAMES.filter((s) => s !== ex);
  return rng.pick(pool.length ? [...pool] : [...CHINESE_SURNAMES]);
}

/** 開局母親：外姓 + 女性化名 */
export function randomChineseMotherName(clanSurname: string): string {
  const maiden = randomMaidenSurname(clanSurname);
  return maiden + randomChineseFeminineGivenName();
}

/**
 * 讀檔校正：母親保外姓；若仍冠本支姓且非血脈母系，改外姓女性名。
 * seedKey 令同一存檔每次校正結果一致。
 */
export function normalizeMotherName(
  clanSurname: string,
  currentName: string,
  seedKey: string,
  keepClanSurname = false,
): string {
  const clan = clanSurname.trim()[0] ?? '李';
  const trimmed = currentName.trim();
  if (!trimmed) return randomChineseMotherName(clan);

  const head = trimmed[0] ?? '';
  const given = (CHINESE_SURNAMES as readonly string[]).includes(head) && trimmed.length >= 2
    ? trimmed.slice(1)
    : trimmed;
  const femininePool = [...FEMININE_GIVEN_NAMES];
  let givenName = given;
  if (!femininePool.includes(givenName as (typeof FEMININE_GIVEN_NAMES)[number])) {
    const h =
      (seedKey.charCodeAt(0) + given.charCodeAt(0) + clan.charCodeAt(0) + 997) %
      femininePool.length;
    givenName = femininePool[h]!;
  }

  if (keepClanSurname && head === clan) {
    return clan + givenName;
  }

  if (head === clan && !keepClanSurname) {
    const surnames = CHINESE_SURNAMES.filter((s) => s !== clan);
    const si = (seedKey.charCodeAt(1) + givenName.charCodeAt(0) + 13) % surnames.length;
    return surnames[si]! + givenName;
  }

  if (!(CHINESE_SURNAMES as readonly string[]).includes(head)) {
    const si = (seedKey.charCodeAt(2) + 7) % CHINESE_SURNAMES.length;
    return CHINESE_SURNAMES[si]! + givenName;
  }

  return head + givenName;
}

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
