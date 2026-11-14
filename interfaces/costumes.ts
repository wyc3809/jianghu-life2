import { z } from 'zod';

export const UNIFORM_SECT_KEYS=['qingyun','tiandao','emei','shaolin','wudang','tangmen','mojiao','huashan','taohua','wugen'] as const;
export const UNIFORM_STANDINGS=[0,1,2,3,4,5,6,7] as const;
export type UniformCostumeId=`uniform-${typeof UNIFORM_SECT_KEYS[number]}-${typeof UNIFORM_STANDINGS[number]}`;
export const UNIFORM_COSTUME_IDS=UNIFORM_SECT_KEYS.flatMap(sect=>UNIFORM_STANDINGS.map(rank=>`uniform-${sect}-${rank}` as UniformCostumeId)) as [UniformCostumeId,...UniformCostumeId[]];
export const FASHION_COSTUME_IDS=['fashion-night','fashion-feast','fashion-snow','fashion-gold'] as const;
export const COSTUME_IDS=[...UNIFORM_COSTUME_IDS,...FASHION_COSTUME_IDS] as const;
export type CostumeId=typeof COSTUME_IDS[number];
export type FashionId=typeof FASHION_COSTUME_IDS[number];
export const costumeIdSchema=z.enum(COSTUME_IDS);
export const fashionIdSchema=z.enum(FASHION_COSTUME_IDS);
export type CostumeIdentity={sectId?:string|null;sectStanding?:number};

/** 只識別已發布的服飾ID，不將未知字串或網址當作素材路徑。 */
export function isCostumeId(value:unknown):value is CostumeId{return typeof value==='string'&&(COSTUME_IDS as readonly string[]).includes(value);}
/** 免費時裝沒有門派限制，不提供屬性加成。 */
export function isFashionId(value:unknown):value is FashionId{return typeof value==='string'&&(FASHION_COSTUME_IDS as readonly string[]).includes(value);}
/** 制服只讀單機真身份：限目前門派及已達職位；無效地位不獲資格。 */
export function canWearCostume(identity:CostumeIdentity,id:unknown):boolean{
  if(isFashionId(id))return true;
  if(!isCostumeId(id))return false;
  const [,sect,rank]=id.split('-');
  const standing=identity.sectStanding;
  return identity.sectId===`sect_${sect}`&&typeof standing==='number'&&Number.isInteger(standing)&&standing>=0&&standing<=7&&Number(rank)<=standing;
}
