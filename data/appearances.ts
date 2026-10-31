import { APPEARANCE_HEADS, APPEARANCE_OUTFITS, APPEARANCE_TONES, type CharacterAppearance } from '@interfaces/appearance';

export const HEAD_LABELS: Record<CharacterAppearance['head'],string> = {
  bamboo:'斗笠俠客',topknot:'束髮劍客',master:'髮髻短鬚',silver:'霜髮劍客',
  ponytail:'高馬尾',loose:'披髮',bun:'簪髮',short:'短髮',
};
export const OUTFIT_LABELS: Record<CharacterAppearance['outfit'],string> = {traveller:'俠客勁裝',scholar:'江湖長衫',cloak:'行旅披風'};
export const TONE_LABELS: Record<CharacterAppearance['tone'],string> = {ink:'玄墨',jade:'青玉',cinnabar:'赭紅',sand:'沙金'};
export const APPEARANCE_COLOURS: Record<CharacterAppearance['tone'],readonly [number,number,number]> = {
  ink:[74,83,86],jade:[70,106,95],cinnabar:[136,66,57],sand:[152,126,83],
};

/** 只為隔離示範／無造型的NPC提供穩定外觀，不消耗遊戲RNG或派發物品。 */
export function appearanceForIndex(index: number): CharacterAppearance {
  const n = Math.max(0,Math.floor(index));
  return { head: APPEARANCE_HEADS[n % APPEARANCE_HEADS.length],
    outfit: APPEARANCE_OUTFITS[(n+2*Math.floor(n / APPEARANCE_HEADS.length)) % APPEARANCE_OUTFITS.length],
    tone: APPEARANCE_TONES[Math.floor(n / 3) % APPEARANCE_TONES.length] };
}
