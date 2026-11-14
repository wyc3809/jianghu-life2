import type { GearDef, GearSlot } from '@data/equipment/catalog';
import catalog from '../appearance/manhua/weapon-catalog.json';
import { inkArtUrl } from './inkAssets';

const weapons=catalog.weapons as Record<string,{src:string;sha256:string}>;
const uniqueRarities=['rare','epic','mythic','divine'];
const otherEquipment=['plain-robe','pine-armor','stormcloud-armor','divine-silk-armor','cloud-boots','jade-token','divine-moon-pendant'];

/** 珍品或以上按真裝備ID用獨有圖；低階按兵器種類共用，護甲飾品保持原圖。 */
export function equipmentArtUrl(def?: GearDef|null,slot:GearSlot='weapon'):string {
  const actual=def?.slot??slot;
  if(def&&actual==='weapon'&&uniqueRarities.includes(def.rarity)&&Object.hasOwn(weapons,def.id)){
    return inkArtUrl(weapons[def.id].src);
  }
  const kind=actual==='weapon'?def?.weaponKind??'sword':def&&otherEquipment.includes(def.id)?def.id:actual==='armor'?'plain-robe':'jade-token';
  return inkArtUrl(`art/manhua/icons/${kind}.webp`);
}
