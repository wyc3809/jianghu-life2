/** 第51項：只用真武學、真卷號及隔離存檔驗證配搭；不連玩家帳戶。 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {SKILL_DEFS} from '../../data/skills/catalog';
import {normalPreset} from '../../core/life/loadoutPresets';
const seed=JSON.parse(readFileSync('.local-online/character-redesign/fixtures.json','utf8')).full;
const external=Object.values(SKILL_DEFS).filter(d=>d.kind==='external'&&d.move&&!d.premium);
const premium=Object.values(SKILL_DEFS).find(d=>d.kind==='external'&&d.premium)!;
const internal=Object.values(SKILL_DEFS).filter(d=>d.kind==='internal');
const qinggong=Object.values(SKILL_DEFS).filter(d=>d.kind==='qinggong');
const full=structuredClone(seed),c=full.state.character;
c.skills=[...external.slice(0,5).map(d=>d.id),internal[0]!.id,qinggong[0]!.id];
c.equippedArts=external.slice(0,5).map(d=>d.id);c.supportArts={internal:internal[0]!.id,qinggong:qinggong[0]!.id};
c.volumes={};c.skillRanks={};c.skillProgress={};c.skillAdvanceNeed={};full.meta.manuals={};
for(const [i,id] of c.skills.entries()){
 const vols=i===0?[1]:i===1?[1,3,7]:i===2?[1,2,3,4,5,6,7]:i===3?[2,5]:[7];
 if(i<5)c.volumes[id]=vols;
 c.skillRanks[id]=0;c.skillProgress[id]=i;c.skillAdvanceNeed[id]=20;
 full.meta.manuals[id]={stars:0,copies:0,...(i<5?{vols}:{})};
}
for(const d of [external[5]!,premium,internal[1]!,qinggong[1]!])full.meta.manuals[d.id]={stars:0,copies:0,...(d.kind==='external'?{vols:[3,7]}:{})};
c.combatLoadout=normalPreset(c);
const empty=structuredClone(full);empty.state.character.skills=[];empty.state.character.equippedArts=[null,null,null,null,null];empty.state.character.supportArts={internal:null,qinggong:null};empty.state.character.combatLoadout=normalPreset(empty.state.character);empty.meta.manuals={};
const promotion=structuredClone(full);for(const id of c.skills.slice(0,5))promotion.state.character.skillProgress[id]=19.9;promotion.state.practiceActionsLeft=3;
const long=structuredClone(full);const longest=Object.values(SKILL_DEFS).filter(d=>d.kind==='external'&&d.move).sort((a,b)=>b.name.length-a.name.length)[0]!;
long.state.character.skills.push(longest.id);long.state.character.volumes[longest.id]=[1,2,3,4,5,6,7];long.state.character.equippedArts[0]=longest.id;long.state.character.combatLoadout=normalPreset(long.state.character);
const ids={external:c.equippedArts,storedExternal:external[5]!.id,premium:premium.id,internal:internal.map(d=>d.id),qinggong:qinggong.map(d=>d.id),long:longest.id};
mkdirSync('.local-online/martial-ui',{recursive:true});writeFileSync('.local-online/martial-ui/fixtures.json',JSON.stringify({full,empty,long,promotion,ids}));
console.log('MARTIAL_FIXTURES',ids);
