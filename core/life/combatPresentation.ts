import type { PendingCombat } from '@interfaces/lifeEngine';
import { foeStyleLabel, inferFoeAiStyle, type FoeAiStyle } from './foeAi';

export function combatSceneLabel(combat: PendingCombat): string {
  if (combat.source === 'spar') return '師門比武場';
  if (combat.source === 'road' || combat.source === 'bandit') return '狹路相逢';
  if (combat.foePower === 'boss') return '強敵當道';
  if (/華山|論劍/.test(combat.title)) return '華山論劍臺';
  return '兵刃相向';
}

export function combatOpeningLines(combat: PendingCombat, style: FoeAiStyle): string[] {
  const scene = combatSceneLabel(combat);
  const styleZh = foeStyleLabel(style);
  return [
    `【${scene}】對上「${combat.foe.name}」——路數${styleZh}。`,
    '刀未出鞘，氣機已撞在一處。',
  ];
}

export function classifyBeat(line: string): 'hit' | 'miss' | 'crit' | 'heal' | 'other' {
  if (/——偏了|偏了|落空|閃過|未中|差半分/.test(line)) return 'miss';
  if (/重創|要害|猛|爆|絕境/.test(line)) return 'crit';
  if (/療|回復|氣血\+|內息\+|回氣/.test(line)) return 'heal';
  if (/——命中|氣血 −|「|擊|刺|砍|掌|拳|傷/.test(line)) return 'hit';
  return 'other';
}

/** 戰況一句摘要：便於一眼讀懂本回合 */
export function summarizeExchange(lines: string[]): string | null {
  if (!lines.length) return null;
  const hits = lines.filter((l) => classifyBeat(l) === 'hit' || classifyBeat(l) === 'crit');
  const misses = lines.filter((l) => classifyBeat(l) === 'miss');
  if (hits.length && misses.length) return '互有來往';
  if (hits.length >= 2) return '刀光往還';
  if (hits.length === 1) return classifyBeat(hits[0]!) === 'crit' ? '一擊沉重' : '一式得手';
  if (misses.length) return '招式落空';
  return null;
}

export function dispositionBlurb(
  disposition: 'kill' | 'release' | 'stun' | 'cripple',
  foeName: string,
): string {
  if (disposition === 'kill') return `你刃下不留——「${foeName}」這一頁，就此撕去。`;
  if (disposition === 'release') return `你收招退開半步：「走。」${foeName}看你一眼，沒有道謝，只把命帶走。`;
  if (disposition === 'cripple') return `你廢去${foeName}一身武功——這一劫，他躲不過。`;
  return `你點暈${foeName}，把人撂在塵土裡。勝了，卻沒有把故事寫死。`;
}

export function styleForCombat(combat: PendingCombat): FoeAiStyle {
  return inferFoeAiStyle(combat.foe.name, combat.foePower ?? 'normal');
}
