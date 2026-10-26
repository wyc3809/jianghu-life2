/** 第46項以真核心建立隔離驗收角色；不讀取或上傳玩家存檔。 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createNewLife } from '../../core/life/gameState';
import { emptyAncestry } from '../../core/life/ancestry';
import { normalPreset } from '../../core/life/loadoutPresets';
import { SKILL_DEFS } from '../../data/skills/catalog';
import { FAMILY_MILESTONES } from '../../data/ancestry/milestones';
import { ACHIEVEMENT_RULES } from '../../core/life/achievements';
const state = createNewLife({ seed:42, name:'驗收少俠', skipCoach:true });
state.pending = null; state.tab = 'home';
Object.assign(state.character.flags, { newbie_done:true, coach_done:true, newbie_trial_won:true });
const c = state.character;
c.skills = ['art_river_fist','基礎吐納','qg_broken_bridge'];
c.equippedArts = ['art_river_fist',null,null,null,null];
c.supportArts = { internal:'基礎吐納',qinggong:'qg_broken_bridge' };
c.volumes = { art_river_fist:[1,3,7] };
c.combatLoadout = normalPreset(c);
const qinggong = Object.values(SKILL_DEFS).find(d => d.kind === 'qinggong' && !d.premium && d.id !== 'qg_broken_bridge')!.id;
const meta = emptyAncestry(); meta.jade = { free:600, paidTest:0 }; meta.pages = 1000;
meta.milestones = FAMILY_MILESTONES.map(m => m.id); meta.jadeAchv = ACHIEVEMENT_RULES.map(a => a.id);
meta.manuals = { art_river_fist:{stars:0,copies:2,vols:[1,3,7]}, art_silk_hand:{stars:0,copies:0,vols:[7]},
 art_iron_body:{stars:0,copies:0}, [qinggong]:{stars:0,copies:0}, pr_void_breath:{stars:0,copies:0} };
const emptyMonth = structuredClone(state); emptyMonth.practiceActionsLeft = 0;
const poor = structuredClone(state); poor.character.money = 0;
mkdirSync('.local-online/game-polish',{recursive:true});
writeFileSync('.local-online/game-polish/fixtures.json',JSON.stringify({ state,meta,emptyMonth,poor,qinggong }));
console.log('GAME_POLISH_FIXTURES_READY');
