import type { LifeGameState } from '@interfaces/lifeEngine';
import { natureLabels } from '@interfaces/lifeEngine';
import { sumEvasionBonus } from '@data/skills/catalog';
import { ensureNature, dominantNature } from './nature';
import { natureVisibleHint } from './lifeVariance';

/** 鎮居／修煉頁「近日傳聞」與學習提示（不顯示四維數值） */
export function jianghuHints(state: LifeGameState): string[] {
  const hints: string[] = [];
  const c = state.character;
  const f = c.flags;

  // 題眼只在開局／掩卷呈現，不佔鎮居首屏
  const natureHint = natureVisibleHint(state);
  if (natureHint) hints.push(natureHint);
  if (state.lifeArc) {
    const npc = state.npcs[state.lifeArc.npcId]?.name;
    const ready = state.lifeArc.monthsLeft <= 0;
    hints.push(
      ready
        ? `${npc ?? '故人'}那邊，「${state.lifeArc.title}」還能再走一遭。`
        : `「${state.lifeArc.title}」未了，約在${state.lifeArc.monthsLeft}個月後。`,
    );
  }
  if (typeof f.echo_pending === 'string' && f.echo_pending) {
    hints.push(String(f.echo_pending));
  }

  if (f.rumor_boss_scarlet) hints.push('茶棚裡有人低聲提「赤練娘」三字，袖裡似藏針。');
  if (f.rumor_boss_iron) hints.push('官道傳聞鐵甲車攔路，過客多繞野徑。');
  if (f.rumor_boss_monk) hints.push('破廟酒氣沖天，有人說瘋僧要試掌。');
  if (f.rumor_boss_black) hints.push('黑風寨鞭影如幕，寨主點名尋人比武。');
  if (f.rumor_boss_frost) hints.push('北嶺傳來寒刀聲，霜刀客似在等人。');
  if (f.rumor_boss_lute) hints.push('河舫夜曲不祥，琵琶一響便有人失踪。');
  if (f.rumor_boss_sand) hints.push('西行沙道有人揚沙劫武，人稱沙蠍客。');
  if (f.rumor_boss_mirror) hints.push('鏡湖夜有孤燈，隱士以息會友。');

  const boost = Number(f.rumor_boost ?? 0);
  if (boost > 0) {
    hints.push(
      boost >= 3
        ? '你連日打聽風聲，江湖上已有人留意你的腳步——翻頁時較易逢奇人異事。'
        : '你近日多問風聲，路遇稍稠，奇緣或近。',
    );
  }

  if (state.world?.lastWorldShift) {
    hints.push(state.world.lastWorldShift);
  }

  const nature = ensureNature(c);
  const dom = dominantNature(c);
  if (nature[dom] >= 40) {
    hints.push(`心性以「${natureLabels[dom]}」獨顯，門牆與奇遇或開或闔。`);
  }

  // 去重、最多 6 條（含心性／主線／餘波）
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of hints) {
    if (!h || seen.has(h)) continue;
    seen.add(h);
    out.push(h);
    if (out.length >= 6) break;
  }
  return out;
}

export function playerEvasionPercent(state: LifeGameState): number {
  const c = state.character;
  const ev = sumEvasionBonus(c.skills, c.skillRanks ?? {}) + c.attributes.danShi / 500;
  return Math.round(Math.min(0.45, ev) * 100);
}
