import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeLabels, wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { skillDisplay } from './flavor';
import { getLifeStageLabel } from './stages';
import { deathCauseOf } from './death';
import { titleLabels } from './titles';
import { previewInheritanceMoney } from './family';
import { formatGenealogyText } from './genealogy';
import { getLifeTheme, pickVarianceEpitaph, themeLabelOf } from './lifeVariance';
import { dominantNature } from './nature';
import { natureLabels } from '@interfaces/lifeEngine';

function pickEpitaph(state: LifeGameState): string {
  // 優先：題眼 × 心性 句式（每世墓誌更有辨識）
  const variance = pickVarianceEpitaph(state);
  const c = state.character;
  const titles = titleLabels(state);
  const cause = deathCauseOf(state) ?? '';

  if (/力竭|敗於|戰/.test(cause) && c.stats.combatsWon >= 5 && getLifeTheme(state).id === 'revenge') {
    return variance;
  }
  if (titles.includes('論劍客') && getLifeTheme(state).id === 'fame') {
    return '　　華山風急，名字卻停在石上——正合求名之願。';
  }
  return variance;
}

export function buildLifeSummary(state: LifeGameState): string {
  const c = state.character;
  const stage = getLifeStageLabel(state);
  const cause = deathCauseOf(state);
  const gen = Number(c.flags.legacy_generation ?? 1);
  const titles = titleLabels(state);
  const lines: string[] = [
    '　　——　墓誌　——',
    '',
    `　　${c.name}`,
    `　　享年 ${c.age} 歲 · ${stage}`,
    `　　卒於 ${state.year} 年${state.month ? `${state.month} 月` : ''}`,
  ];

  if (cause) {
    lines.push(`　　死因：${cause}`);
  }
  if (gen > 1 || c.flags.legacy_ancestor) {
    lines.push(`　　第 ${gen} 世${c.flags.legacy_ancestor ? ` · 承自「${c.flags.legacy_ancestor}」` : ''}`);
  }
  if (titles.length) {
    lines.push(`　　綽號：${titles.join('、')}`);
  }

  const theme = themeLabelOf(state);
  const dom = dominantNature(c);
  lines.push(`　　題眼：${theme}　·　心性偏「${natureLabels[dom]}」`);

  lines.push(
    '',
    '　　【五維】',
    ...wuxiaAttributeKeys.map(
      (k) => `　　${wuxiaAttributeLabels[k]}　${c.attributes[k]}`,
    ),
    '',
    `　　武學 ${c.martial}　·　名望 ${c.reputation}`,
    `　　財富峰值 ${c.stats.wealthPeak} 兩`,
    `　　閱事 ${c.stats.eventsSeen}　·　決鬥 ${c.stats.combats}（勝 ${c.stats.combatsWon}）`,
    `　　姻緣 ${c.stats.lovers}`,
    `　　子女 ${c.childrenCount ?? 0}`,
    `　　心性 俠${c.nature?.xia ?? 0} · 邪${c.nature?.xie ?? 0} · 狂${c.nature?.kuang ?? 0} · 惡${c.nature?.e ?? 0}`,
  );

  if (c.skills.length) {
    const skillLine = c.skills.map((id) => skillDisplay(c, id)).join('、');
    lines.push('', '　　【武功】', `　　${skillLine}`);
  }
  if (c.sectId && state.sects[c.sectId]) {
    lines.push('', `　　【門派】${state.sects[c.sectId].name}`);
  }
  if (c.loverId && state.npcs[c.loverId]) {
    lines.push(`　　【眷屬】${state.npcs[c.loverId].name}`);
  }
  if (c.family?.childrenNames?.length) {
    lines.push(`　　【子女】${c.family.childrenNames.join('、')}`);
  }
  const heir =
    typeof c.flags.heir_name === 'string' && c.flags.heir_name
      ? String(c.flags.heir_name)
      : c.family?.childrenNames?.[0];
  if (heir) {
    lines.push(`　　【繼承人】${heir}`);
  }

  const carryBits: string[] = [];
  if (c.flags.family_legacy || (c.childrenCount ?? 0) > 0) carryBits.push('族規／血脈');
  if (c.flags.legacy_teacher) carryBits.push('傳功');
  if (c.flags.legacy_friend) carryBits.push('故人');
  if (carryBits.length) {
    lines.push('', `　　【可傳後世】${carryBits.join('、')}`);
  }
  if ((c.childrenCount ?? 0) > 0 || c.flags.family_legacy) {
    const coin = previewInheritanceMoney(state);
    if (coin > 0) {
      lines.push(`　　【來世可繼族產】約 ${coin} 兩（轉世時入匣）`);
    }
  }

  lines.push('', ...formatGenealogyText(state).map((l) => (l.startsWith('【') ? `　　${l}` : `　${l}`)));

  lines.push('', pickEpitaph(state), '', '　　（印）終');
  return lines.join('\n');
}
