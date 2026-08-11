import type { LifeGameState } from '@interfaces/lifeEngine';
import { seasonLabel } from '@core/life/monthly';

export type InkSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type InkPlace = 'town' | 'hall' | 'wild' | 'mountain' | 'river';

export function seasonToInk(month: number): InkSeason {
  const s = seasonLabel(month);
  if (s === '春') return 'spring';
  if (s === '夏') return 'summer';
  if (s === '秋') return 'autumn';
  return 'winter';
}

export function placeToInk(location: string | undefined): InkPlace {
  const loc = location ?? '';
  if (/山|華山|嶺|峰/.test(loc)) return 'mountain';
  if (/河|湖|江|橋/.test(loc)) return 'river';
  if (/館|醫|武館|門/.test(loc)) return 'hall';
  if (/野|官道|沙|林/.test(loc)) return 'wild';
  return 'town';
}

/** 夜氣：事件語境／奇遇／明示 night 標籤 → 整頁紙氣偏松煙 */
export function isInkNight(opts: {
  title?: string;
  body?: string;
  tags?: string[];
  pendingKind?: string;
  omen?: boolean;
}): boolean {
  const tags = opts.tags ?? [];
  if (tags.includes('night')) return true;
  const blob = `${opts.title ?? ''}${opts.body ?? ''}${tags.join('')}`;
  if (/夜|月下|宵|暮|深夜|三更|夜雨/.test(blob)) return true;
  if (opts.pendingKind === 'special') return true;
  if (opts.omen) return true;
  return false;
}

export function sceneClassNames(
  state: LifeGameState,
  opts?: { combat?: boolean; eventTitle?: string; eventBody?: string; eventTags?: string[] },
): string {
  const season = seasonToInk(state.month ?? 1);
  const place = placeToInk(state.character.location);
  const omen = Boolean(
    state.pending && (state.pending.kind === 'special' || state.character.flags.rumor_boost),
  );
  const night = isInkNight({
    title: opts?.eventTitle,
    body: opts?.eventBody,
    tags: opts?.eventTags,
    pendingKind: state.pending?.kind,
    omen,
  });
  const bits = [`ink-scene--${season}`, `ink-scene--${place}`];
  if (opts?.combat) bits.push('ink-scene--combat');
  if (omen) bits.push('ink-scene--omen');
  if (night) bits.push('ink-scene--night');
  return bits.join(' ');
}

/** 是否應關閉招牌動效（設定閘 ⊕ 系統偏好） */
export function shouldReduceInkMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.inkMotion === 'reduce') {
    return true;
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  return false;
}
