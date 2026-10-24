/** 隔離測試人物及真實核心結果預覽；不改玩家存檔或雲端。 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createNewLife } from '../../core/life/gameState';
import { emptyAncestry } from '../../core/life/ancestry';
import { bannerState, setWish, wishPool, pull, type BannerId } from '../../core/life/gacha';
import { FAMILY_MILESTONES } from '../../data/ancestry/milestones';
import { ACHIEVEMENT_RULES } from '../../core/life/achievements';
const fixtures = [];
for (const name of ['ordinary', 'premium', 'wish', 'ten', 'pages']) {
  const state = createNewLife({ seed: 42, name: '驗書少俠', skipCoach: true });
  state.pending = null; state.tab = 'home';
  state.character.flags.newbie_done = true; state.character.flags.coach_done = true;
  const meta = emptyAncestry(); meta.jade = { free: 600, paidTest: 600 };
  meta.milestones = FAMILY_MILESTONES.map(x => x.id); meta.jadeAchv = ACHIEVEMENT_RULES.map(x => x.id);
  const banner: BannerId = name === 'premium' || name === 'ten' ? 'zhenben' : 'jianghu';
  const n = name === 'ten' ? 10 : 1;
  meta.gacha = { pulls: 0, banners: {} };
  if (name === 'wish') { setWish(meta, banner, wishPool(banner, meta)[0]!); bannerState(meta, banner).sinceWish = 39; }
  let expected = structuredClone(meta), results = pull(expected, banner, n)!;
  for (let i = 0; i < 1000; i++) {
    meta.gacha = { ...meta.gacha!, pulls: i };
    expected = structuredClone(meta); results = pull(expected, banner, n)!;
    if (name === 'wish' || (name === 'pages' ? results.every(r => r.kind === 'pages')
      : name === 'ordinary' ? results.some(r => r.kind !== 'pages') : results.some(r => r.kind !== 'pages' && r.isPremium))) break;
  }
  fixtures.push({ name, state, meta, banner, n, expected, results });
}
mkdirSync('.local-online/codex-quality', { recursive: true });
writeFileSync('.local-online/codex-quality/fixtures.json', JSON.stringify(fixtures));
console.log('CODEX_FIXTURES_READY', fixtures.map(f => [f.name, f.results.length]));
