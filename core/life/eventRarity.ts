export type EventRarity = 'white' | 'blue' | 'purple' | 'gold';

/** 際遇品質標籤：源自事件本身抽中嘅池——boss／秘傳池最罕見，一般池按 weight 分白/藍 */
export const EVENT_RARITY_LABEL: Record<EventRarity, string> = {
  white: '尋常',
  blue: '有緣',
  purple: '難得',
  gold: '天賜奇緣',
};

/** 一般池入面，weight 明顯低過預設值（10）代表策劃本身已標記呢條事件較罕見 */
const ORDINARY_RARE_WEIGHT_MAX = 5;

export function rarityForOrdinaryEvent(weight: number | undefined): EventRarity {
  const w = weight ?? 10;
  return w <= ORDINARY_RARE_WEIGHT_MAX ? 'blue' : 'white';
}

export function rarityForSpecialEvent(isBoss: boolean): EventRarity {
  return isBoss ? 'gold' : 'purple';
}
