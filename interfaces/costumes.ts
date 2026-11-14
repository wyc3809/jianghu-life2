import { z } from 'zod';

export const UNIFORM_COSTUME_IDS=['uniform-qingyun-0','uniform-qingyun-1','uniform-qingyun-2','uniform-qingyun-3','uniform-qingyun-4','uniform-qingyun-5','uniform-qingyun-6','uniform-qingyun-7'] as const;
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
  const standing=identity.sectStanding;
  return isCostumeId(id)&&identity.sectId==='sect_qingyun'&&typeof standing==='number'&&Number.isInteger(standing)&&standing>=0&&standing<=7&&UNIFORM_COSTUME_IDS.indexOf(id as typeof UNIFORM_COSTUME_IDS[number])<=standing;
}
