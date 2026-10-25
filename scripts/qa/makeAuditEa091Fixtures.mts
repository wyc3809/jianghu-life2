/** 第45項（EA0.91.0 審計修正）前後圖用隔離存檔；唔讀玩家存檔、唔連雲端。 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createNewLife, snapshotRng, syncRngFromState } from '../../core/life/gameState';
import { emptyAncestry } from '../../core/life/ancestry';
import { CULTIVATION_TIERS, attemptCultivationBreakthrough } from '../../core/life/cultivation';
import { getRng } from '../../core/random';
import { FAMILY_MILESTONES } from '../../data/ancestry/milestones';
import { ACHIEVEMENT_RULES } from '../../core/life/achievements';

function base() {
  const s = createNewLife({ seed: 42, name: '驗收少俠', skipCoach: true });
  s.pending = null;
  s.tab = 'home';
  const c = s.character;
  Object.assign(c.flags, { newbie_done: true, coach_done: true, newbie_trial_won: true, coach_flipped: true, coach_chose: true });
  c.martial = 150;
  c.money = 3000;
  c.cultivation = { tier: 8, xp: CULTIVATION_TIERS[8]!.cap, reserve: 0 };
  c.health = Math.round(c.maxHealth * 0.4);
  c.actionPoints = 100;
  const sectId = Object.keys(s.sects)[0];
  if (sectId) { c.sectId = sectId; c.sectStanding = 1; }
  return s;
}

// B：一般狀態；調 RNG 直到今次突破會失敗（兩個版本 RNG 抽法一樣）
const b = base();
for (let i = 0; i < 50; i++) {
  const probe = structuredClone(b);
  if (!attemptCultivationBreakthrough(probe).success) break;
  syncRngFromState(b); getRng().next(); snapshotRng(b);
}

// A：驚鴻論劍故人事件掛住
const a = base();
a.character.health = a.character.maxHealth;
a.lifeArc = { id: 'arc_zhan_rival', title: '驚鴻論劍', beat: 0, maxBeats: 6, npcId: 'npc_zhan_jinghong', monthsLeft: 0 };
a.pending = { eventId: 'arc_visit_arc_zhan_rival_0', year: a.year, month: a.month, kind: 'story' };

const meta = emptyAncestry();
meta.jade = { free: 0, paidTest: 0 };
meta.pages = 100;
meta.milestones = FAMILY_MILESTONES.map((x) => x.id);
meta.jadeAchv = ACHIEVEMENT_RULES.map((x) => x.id);

mkdirSync('.local-online/audit-ea091', { recursive: true });
writeFileSync('.local-online/audit-ea091/fixtures.json', JSON.stringify({ arc: a, main: b, meta }));
console.log('AUDIT_EA091_FIXTURES_READY');
