/** 只輸出呈現器既有時計；製作動作不重設結算或攻擊節奏。 */
import fs from 'node:fs';
import { SKILL_DEFS } from '../../data/skills/catalog';
import { MARTIAL_POSES } from '../../src/fx/art/martialPoses';
import { choreoForArt } from '../../src/fx/art/recipes';
const rows=Object.values(SKILL_DEFS).map(d=>{const p=MARTIAL_POSES.find(p=>p.id===d.id)!;const c=d.kind==='external'?choreoForArt(d.id):null;return{id:d.id,name:d.name,kind:d.kind,family:p.family,duration:d.kind==='external'?c?.dur??.72:1.1,contacts:d.kind==='external'?c?.events.flatMap(e=>e.kind==='hit'?[e.t]:[])??[.36]:[],premium:Boolean(d.premium)};});
fs.writeFileSync('design/art/independent-animation/clocks.json',JSON.stringify(rows,null,2)+'\n');console.log('PRESENTATION_CLOCKS',rows.length);
