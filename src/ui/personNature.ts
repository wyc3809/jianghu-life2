import { natureKeys, natureLabels, type NatureAttr, type LifeCharacter } from '@interfaces/lifeEngine';
import { defaultNature } from '@core/life/nature';
import { inkArtUrl } from './inkAssets';

/** 只讀最高心性；同分沿用俠／邪／狂／惡次序，舊檔缺項只於顯示時後備。 */
export function personNatureMark(character: Pick<LifeCharacter, 'nature'>) {
  const defaults = defaultNature();
  const value = (key: NatureAttr) => Number.isFinite(character.nature?.[key]) ? character.nature[key] : defaults[key];
  const key = natureKeys.reduce((best, candidate) => value(candidate) > value(best) ? candidate : best);
  return { key, label: natureLabels[key], art: inkArtUrl(`art/nature/nature-${key}.webp`) };
}
