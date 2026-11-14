import { SECT_RANKS } from './content/packs';
import { UNIFORM_COSTUME_IDS,FASHION_COSTUME_IDS,type CostumeId } from '../interfaces/costumes';

export const QINGYUN_UNIFORMS=UNIFORM_COSTUME_IDS.map((id,standing)=>({id,standing,sectId:'sect_qingyun',name:`青雲・${SECT_RANKS[standing].name}`}));
export const FREE_FASHIONS=FASHION_COSTUME_IDS.map((id,i)=>({id,name:['玄夜行裝','朱霞宴服','雪山裘衣','金縷華服'][i]}));
/** 服飾名稱只來自已發布目錄，不顯示未完成門派的假制服。 */
export function costumeLabel(id:CostumeId):string{return [...QINGYUN_UNIFORMS,...FREE_FASHIONS].find(c=>c.id===id)?.name??'常服';}
