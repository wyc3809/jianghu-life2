import type { Disciple, LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { randomChineseName } from '@core/ids';
import { rankName, rollAdvanceNeed } from './martialRanks';
import { pushChronicle } from './chronicle';
import { syncRngFromState, snapshotRng } from './gameState';
import { applyAchievementRankBonus } from './jianghuRank';

export const FOUND_SECT_MIN_AGE = 30;
export const FOUND_SECT_MIN_MARTIAL = 300;
export const FOUND_SECT_MIN_REPUTATION = 100;
export const FOUND_SECT_COST = 200;
export const RECRUIT_COST = 20;

export type GateResult = { ok: true } | { ok: false; reason: string };

/** 開宗立派門檻：需武學／名望／年齡達標，銀両夠，且不在既有門派任職 */
export function canFoundSect(state: LifeGameState): GateResult {
  const c = state.character;
  if (!c.alive || state.phase !== 'playing') return { ok: false, reason: '此刻無法開宗立派。' };
  if (state.pending || state.pendingCombat) return { ok: false, reason: '尚有要事未了。' };
  if (state.foundedSect) return { ok: false, reason: '你已開宗立派，不必重來。' };
  if (c.sectId) return { ok: false, reason: '身在師門，需先退出師門方可自立門戶。' };
  if (c.age < FOUND_SECT_MIN_AGE) return { ok: false, reason: `需滿 ${FOUND_SECT_MIN_AGE} 歲方可開宗立派。` };
  if (c.martial < FOUND_SECT_MIN_MARTIAL) return { ok: false, reason: `武學需達 ${FOUND_SECT_MIN_MARTIAL} 以上。` };
  if (c.reputation < FOUND_SECT_MIN_REPUTATION) return { ok: false, reason: `名望需達 ${FOUND_SECT_MIN_REPUTATION} 以上。` };
  if (c.money < FOUND_SECT_COST) return { ok: false, reason: `開宗立派需銀両 ${FOUND_SECT_COST} 兩。` };
  return { ok: true };
}

export function foundSect(state: LifeGameState, sectName: string): string[] {
  const gate = canFoundSect(state);
  if (!gate.ok) return [gate.reason];
  syncRngFromState(state);
  const c = state.character;
  const name = sectName.trim() || `${c.name}門`;
  c.money -= FOUND_SECT_COST;
  state.foundedSect = {
    id: `founded_${state.year}_${state.month}`,
    name,
    founderName: c.name,
    foundedYear: state.year,
    fame: 0,
    disciples: [],
    maxDisciples: 3,
  };
  c.flags.founded_sect = true;
  const lines = [`你於${state.year}年開山立派，門號「${name}」，自此江湖上又添一支傳承。`];
  lines.push(...applyAchievementRankBonus(state, 400));
  pushChronicle(state, lines);
  snapshotRng(state);
  return lines;
}

export function canRecruitDisciple(state: LifeGameState): GateResult {
  const c = state.character;
  const sect = state.foundedSect;
  if (!sect) return { ok: false, reason: '尚未開宗立派。' };
  if (!c.alive || state.phase !== 'playing') return { ok: false, reason: '此刻無法收徒。' };
  if (state.pending || state.pendingCombat) return { ok: false, reason: '尚有要事未了。' };
  if (sect.disciples.filter((d) => d.status === 'training').length >= sect.maxDisciples) {
    return { ok: false, reason: '門下弟子已滿，聲望再高些方能擴收。' };
  }
  if (c.money < RECRUIT_COST) return { ok: false, reason: `收徒需銀両 ${RECRUIT_COST} 兩。` };
  return { ok: true };
}

/** 收徒：資質隨機，主修武學傳自師父（玩家）已學武學之一 */
export function recruitDisciple(state: LifeGameState): string[] {
  const gate = canRecruitDisciple(state);
  if (!gate.ok) return [gate.reason];
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const sect = state.foundedSect!;
  c.money -= RECRUIT_COST;

  const skillPool = c.skills.length ? c.skills : ['基礎吐納'];
  const skillId = rng.pick(skillPool);
  const aptitude = rng.nextInt(30, 90);
  const disciple: Disciple = {
    id: `d_${sect.disciples.length}_${rng.nextInt(1000, 9999)}`,
    name: randomChineseName(),
    gender: rng.chance(0.5) ? 'male' : 'female',
    aptitude,
    loyalty: rng.nextInt(50, 80),
    skillId,
    rank: 0,
    progress: 0,
    advanceNeed: rollAdvanceNeed(0, rng),
    monthsWithSect: 0,
    status: 'training',
  };
  sect.disciples.push(disciple);
  const lines = [`「${disciple.name}」慕名投帖拜師，你收其為徒，傳以「${skillId}」。`];
  pushChronicle(state, lines);
  snapshotRng(state);
  return lines;
}

const TEACH_PROGRESS_GAIN = 1;

/** 親自指導一名弟子：花一次修煉行動，保證有進度（唔靠月度隨機） */
export function teachDisciple(state: LifeGameState, discipleId: string): string[] {
  const sect = state.foundedSect;
  if (!sect) return ['尚未開宗立派。'];
  const disciple = sect.disciples.find((d) => d.id === discipleId && d.status === 'training');
  if (!disciple) return ['此徒已不在門下受教。'];
  syncRngFromState(state);
  const rng = getRng();
  const lines = advanceDisciple(state, disciple, TEACH_PROGRESS_GAIN + rng.nextFloat() * 0.5, '你親自指點');
  snapshotRng(state);
  return lines;
}

function advanceDisciple(
  state: LifeGameState,
  disciple: Disciple,
  gain: number,
  narratePrefix: string,
): string[] {
  const rng = getRng();
  const sect = state.foundedSect!;
  const lines: string[] = [];
  disciple.progress += gain;
  if (disciple.progress < disciple.advanceNeed || disciple.rank >= 3) return lines;
  disciple.rank += 1;
  disciple.progress = 0;
  disciple.advanceNeed = disciple.rank >= 3 ? Number.POSITIVE_INFINITY : rollAdvanceNeed(disciple.rank, rng);
  sect.fame += 2 + disciple.rank;
  lines.push(`${narratePrefix}，「${disciple.name}」武學精進，已至「${rankName(disciple.rank)}」。`);
  if (disciple.rank >= 3) {
    disciple.status = 'graduated';
    sect.fame += 15;
    state.character.reputation += 10;
    lines.push(`「${disciple.name}」學成出師，下山行走江湖，為「${sect.name}」添了一段佳話。`);
    lines.push(...applyAchievementRankBonus(state, 200));
  }
  return lines;
}

/** 每月同步：弟子被動成長／忠誠波動／離門，回報少量敘事（唔逐月洗版） */
export function tickFoundedSect(state: LifeGameState): string[] {
  const sect = state.foundedSect;
  if (!sect) return [];
  const rng = getRng();
  const lines: string[] = [];
  for (const disciple of sect.disciples) {
    if (disciple.status !== 'training') continue;
    disciple.monthsWithSect += 1;

    // 忠誠隨資質／師門聲望波動
    const loyaltyDrift = rng.nextInt(-4, 3) + (sect.fame > 20 ? 1 : 0);
    disciple.loyalty = Math.max(0, Math.min(100, disciple.loyalty + loyaltyDrift));

    if (disciple.loyalty <= 0) {
      disciple.status = 'left';
      lines.push(`「${disciple.name}」心生去意，收拾行囊離了門牆。`);
      continue;
    }

    // 資質決定被動成長機率
    if (rng.chance(0.1 + disciple.aptitude / 400)) {
      const gain = 0.4 + disciple.aptitude / 200;
      lines.push(...advanceDisciple(state, disciple, gain, '弟子勤練不輟'));
    }

    // 偶發：弟子遇險（小機率，需師父破財相助，否則損忠誠）
    if (rng.chance(0.015)) {
      const helped = state.character.money >= 10;
      if (helped) {
        state.character.money -= 10;
        disciple.loyalty = Math.min(100, disciple.loyalty + 5);
        lines.push(`「${disciple.name}」在外遇險求助，你出銀十兩替他解圍，師徒情分更深。`);
      } else {
        disciple.loyalty = Math.max(0, disciple.loyalty - 10);
        lines.push(`「${disciple.name}」在外遇險求助，你囊中羞澀，愛莫能助。`);
      }
    }
  }
  return lines;
}
