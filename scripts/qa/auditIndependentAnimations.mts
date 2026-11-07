/** 以真啟用目錄及磁碟素材建立製作清單；有原圖不等於已接入或通過人體驗收。 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { SKILL_DEFS } from '../../data/skills/catalog';
import { MARTIAL_POSES } from '../../src/fx/art/martialPoses';
import { ART_CHOREOS } from '../../src/fx/art/recipes';
import directions from '../../design/art/martial-identities/directions.json';
const output='production/qa/evidence/redesign/independent-animations';
fs.mkdirSync(output,{recursive:true});
const metadata=JSON.parse(fs.readFileSync('public/ink/art/martial/anchors.json','utf8')) as Record<string,{frameCount:number;sheet:string;sourceSha256:string}>;
const hash=(path:string)=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const rows=Object.values(SKILL_DEFS).map(skill=>{
  const pose=MARTIAL_POSES.find(p=>p.id===skill.id);
  if(!pose)throw Error(`啟用武學沒有動作定義：${skill.id}`);
  const variants=pose.critRecovery?[skill.id+'-crit',skill.id+'-kill']:pose.premium?[skill.id+'-detail']:[];
  const atlases=[skill.id,...variants].map(id=>{
    const record=metadata[id],path=`public/ink/art/martial/${id}.webp`;
    if(!record||record.frameCount!==8||!fs.existsSync(path))throw Error(`未齊原圖：${id}`);
    return{id,path,frames:record.frameCount,bytes:fs.statSync(path).size,sha256:hash(path),sourceSheet:record.sheet};
  });
  const effects=(skill.premium?['signature','detail','finish']:['signature']).map(layer=>{
    const path=`public/ink/art/martial/${skill.id}-fx-${layer}.webp`;if(!fs.existsSync(path))throw Error(`未齊特效：${path}`);return{layer,path,sha256:hash(path)};
  });
  return{id:skill.id,name:skill.name,kind:skill.kind,premium:Boolean(skill.premium),family:pose.family,
    direction:(directions as Record<string,string[]>)[skill.id],atlases,effects,
    eventChoreography:ART_CHOREOS.some(c=>c.artId===skill.id),
    sourcePosesAvailable:true,sourceActor:'固定原人物；未兼容所選頭部及三套衣著',
    productionIndependentAppearanceAnimation:false,visualAccepted:false};
});
const baseHashes=rows.map(r=>r.atlases[0].sha256);if(new Set(baseHashes).size!==rows.length)throw Error('不同武學重用同一張主招圖集');
const families=Object.fromEntries([...new Set(rows.map(r=>r.family))].map(f=>[f,rows.filter(r=>r.family===f).length]));
const summary={canonical:rows.length,families,sourceAtlases:rows.reduce((n,r)=>n+r.atlases.length,0),
  sourceFrames:rows.reduce((n,r)=>n+r.atlases.reduce((a,v)=>a+v.frames,0),0),
  effects:rows.reduce((n,r)=>n+r.effects.length,0),eventChoreographies:ART_CHOREOS.length,
  appearanceCompatibleIndependentAnimations:0,visualAccepted:0};
fs.writeFileSync(output+'/coverage.json',JSON.stringify({baseline:'EA0.101.1',summary,rows},null,2)+'\n');
let md='# 全武學獨立動畫製作清單\n\n基準EA0.101.1；從真啟用目錄及磁碟檔案產生，不把舊報告的「已接入」當作現行狀態。\n\n';
md+=`${summary.canonical}門、${Object.keys(families).length}類、${summary.sourceAtlases}張原人物圖集、${summary.sourceFrames}格、${summary.effects}張特效。現有獨立事件編排${summary.eventChoreographies}套；所選面孔／衣著兼容的逐門獨立動作0套。\n\n`;
md+='| 武學 | 類別 | 來源格數 | 獨立事件編排 | 玩家造型兼容 |\n|---|---|---:|---|---|\n';
for(const r of rows)md+=`| ${r.name}（${r.id}） | ${r.family} | ${r.atlases.reduce((n,a)=>n+a.frames,0)} | ${r.eventChoreography?'有':'未製作'} | 待製作 |\n`;
md+='\n製作門檻：每門真動作與持武；同一套七卷共用該門動作、讀真卷序與真戰果；內功／身法只呈現實際支援事件。保持固定人物比例，不以換色、放大、粒子、速度微調或換上另一個人物冒充獨立動作。\n';
fs.writeFileSync(output+'/coverage.md',md);console.log(JSON.stringify(summary));
