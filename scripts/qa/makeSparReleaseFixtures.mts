/** 建立隔離的schema v1測試存檔，供正式構建驗證；不讀取玩家或雲端資料。 */
import fs from 'node:fs';
import { createNewLife } from '../../core/life/gameState';
import { emptyAncestry } from '../../core/life/ancestry';
import { lifeGameStateSchema } from '../../interfaces/lifeEngine';
import { FAMILY_MILESTONES } from '../../data/ancestry/milestones';
import { ACHIEVEMENT_RULES } from '../../core/life/achievements';
const fixtures = [1, 3, 7].map(count => {
  const state = createNewLife({ seed: 42, name: `驗版${count}招`, skipCoach: true });
  const c = state.character;
  c.flags.newbie_done = true; c.flags.coach_done = true;
  c.skills = ['art_river_fist']; c.equippedArts = ['art_river_fist', null, null, null, null];
  c.supportArts = { internal: null, qinggong: null };
  c.volumes = { art_river_fist: Array.from({ length: count }, (_, i) => i + 1) };
  c.maxHealth = c.health = 5000; c.martial = 0;
  c.equipment = { weapon: null, armor: null, accessory: null };
  c.flags.spar_stage = 1; state.pending = null; state.tab = 'home';
  lifeGameStateSchema.parse(state);
  const meta = emptyAncestry(); meta.jade = { free: 600, paidTest: 0 };
  meta.milestones = FAMILY_MILESTONES.map(m => m.id); meta.jadeAchv = ACHIEVEMENT_RULES.map(a => a.id);
  meta.manuals = { art_river_fist: { stars: 0, copies: 0, vols: c.volumes.art_river_fist } };
  return { count, state, meta };
});
fs.mkdirSync('.local-online/release-ea089', { recursive: true });
fs.writeFileSync('.local-online/release-ea089/fixtures.json', JSON.stringify(fixtures));
console.log('SPAR_RELEASE_FIXTURES_READY', fixtures.map(f => f.count));
