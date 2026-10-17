/** 六流派小冊：所有現有武學都有入口，每冊只集中少量同派／兼修武學。 */
import type { AncestryMeta } from '@interfaces/ancestry';
import { getSkillDef } from '@data/skills/catalog';
import { SCHOOLS, schoolsOfSkill, primarySchoolOfSkill, type SchoolId } from '@data/redesign/schools';
import { MARTIAL_SCHOOL_GROUPS } from '@data/redesign/martialSchools';
import { SCHOOL_GACHA_POOL_MIN, SCHOOL_GACHA_POOL_MAX } from '@data/redesign/testParams';

export type SchoolBanner = 'jianghu' | 'zhenben';
export interface SchoolGachaPool {
  id: string;
  banner: SchoolBanner;
  school: SchoolId;
  part: number;
  free: string[];
  premium: string[];
  arts: string[];
}

function makePools(): SchoolGachaPool[] {
  const pools: SchoolGachaPool[] = [];
  const all = Object.values(MARTIAL_SCHOOL_GROUPS).flat();
  for (const school of SCHOOLS) {
    const own = MARTIAL_SCHOOL_GROUPS[school.id];
    const free = own.filter(id => !getSkillDef(id)?.premium);
    const premium = own.filter(id => getSkillDef(id)?.premium);
    const supports = all.filter(id => !getSkillDef(id)?.premium && !free.includes(id) && schoolsOfSkill(getSkillDef(id)).includes(school.id));
    // 每冊優先帶至少一門內功／身法（該流派有適性先配），唔亂改武學原本特性。
    const staples = ['internal', 'qinggong'].flatMap(kind => {
      const id = [...free, ...supports].find(id => getSkillDef(id)?.kind === kind);
      return id ? [id] : [];
    });
    const rest = free.filter(id => !staples.includes(id));
    const chunkSize = SCHOOL_GACHA_POOL_MAX - staples.length;
    for (let i = 0; i < rest.length; i += chunkSize) {
      const pack = [...staples, ...rest.slice(i, i + chunkSize)];
      for (const id of [...free, ...supports]) {
        if (pack.length >= SCHOOL_GACHA_POOL_MIN) break;
        if (!pack.includes(id)) pack.push(id);
      }
      const part = Math.floor(i / chunkSize) + 1;
      pools.push({ id: `jianghu-${school.id}-${part}`, banner: 'jianghu', school: school.id, part, free: pack, premium: [], arts: pack });
    }
    // 珍本只喺付費池；其餘出貨限定同派江湖配套，6%非心願珍本判定沿用。
    const supportCount = Math.max(SCHOOL_GACHA_POOL_MIN - premium.length, Math.min(3, SCHOOL_GACHA_POOL_MAX - premium.length));
    const paidFree = [...new Set([...staples, ...free, ...supports])].slice(0, supportCount);
    pools.push({ id: `zhenben-${school.id}-1`, banner: 'zhenben', school: school.id, part: 1, free: paidFree, premium, arts: [...premium, ...paidFree] });
  }
  return pools;
}

export const SCHOOL_GACHA_POOLS: readonly SchoolGachaPool[] = makePools();

/** 呢個貨幣類別／流派可以揀嘅全部小冊。 */
export function schoolGachaPools(banner: SchoolBanner, school?: SchoolId): SchoolGachaPool[] {
  return SCHOOL_GACHA_POOLS.filter(pool => pool.banner === banner && (!school || pool.school === school));
}

/** 指定武學所在小冊；用嚟保留舊心願，亦可由收藏直接追心願。 */
export function schoolPoolForArt(banner: SchoolBanner, id: string): SchoolGachaPool | undefined {
  const matching = schoolGachaPools(banner).filter(pool => (banner === 'zhenben' ? pool.premium : pool.free).includes(id));
  return matching.find(pool => pool.school === primarySchoolOfSkill(getSkillDef(id))) ?? matching[0];
}

/** 純讀取：舊資料未揀冊就先配返舊心願，唔扣資源或清保底。 */
export function activeSchoolGachaPool(meta: AncestryMeta, banner: SchoolBanner): SchoolGachaPool {
  const selected = meta.gacha?.selection?.[banner];
  const valid = schoolGachaPools(banner).find(pool => pool.id === selected);
  const wish = meta.gacha?.banners[banner]?.wish;
  if (valid && (!wish || (banner === 'zhenben' ? valid.premium : valid.free).includes(wish))) return valid;
  return (wish ? schoolPoolForArt(banner, wish) : undefined) ?? valid ?? schoolGachaPools(banner)[0]!;
}
