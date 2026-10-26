/** 第48項人物頁驗收：真實持有物與獨立配搭，不連接玩家帳戶。 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { GEAR_CATALOG } from '../../data/equipment/catalog';
import { normalPreset } from '../../core/life/loadoutPresets';
const f = JSON.parse(readFileSync('.local-online/game-polish/fixtures.json','utf8'));
f.state.character.name = '黃天一';
f.state.character.gear = GEAR_CATALOG.map(d=>d.id);
f.state.character.equipment = {weapon:'old-sword',armor:'plain-robe',accessory:null};
f.state.character.combatLoadout = normalPreset(f.state.character);
const empty=structuredClone(f);empty.state.character.gear=[];empty.state.character.equipment={weapon:null,armor:null,accessory:null};
const long=structuredClone(f);long.state.character.name='百里長風無雙少俠';
mkdirSync('.local-online/character-redesign',{recursive:true});
writeFileSync('.local-online/character-redesign/fixtures.json',JSON.stringify({full:f,empty,long}));
console.log('PERSON_FIXTURES_READY',f.state.character.gear.length);
