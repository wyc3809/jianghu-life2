import { SECT_RANKS,SECT_CONTENT } from './content/packs';
import { UNIFORM_COSTUME_IDS,FASHION_COSTUME_IDS,type CostumeId } from '../interfaces/costumes';

export const SECT_UNIFORM_GROUPS=SECT_CONTENT.map(sect=>({id:sect.id,name:sect.name}));
export const SECT_UNIFORMS=UNIFORM_COSTUME_IDS.map(id=>{
  const [,key,rank]=id.split('-'),standing=Number(rank),sectId=`sect_${key}`;
  const sect=SECT_CONTENT.find(s=>s.id===sectId)!;
  return {id,standing,sectId,rankName:SECT_RANKS[standing].name,name:`${sect.name}・${SECT_RANKS[standing].name}`};
});
export const FREE_FASHIONS=FASHION_COSTUME_IDS.map((id,i)=>({id,name:['玄夜行裝','朱霞宴服','雪山裘衣','金縷華服'][i]}));
/** 目錄提供十派預覽；實際穿著仍由確認指令核對目前門派及地位。 */
export function uniformsForSect(sectId:string|null|undefined){return SECT_UNIFORMS.filter(item=>item.sectId===sectId);}
/** 服飾名稱只來自已發布目錄，不顯示未完成門派的假制服。 */
export function costumeLabel(id:CostumeId):string{return [...SECT_UNIFORMS,...FREE_FASHIONS].find(c=>c.id===id)?.name??'常服';}
