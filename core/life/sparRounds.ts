import type { LifeCharacter } from '@interfaces/lifeEngine';
import { volumeMove } from '@data/skills/volumes';
import { MANUAL_STAR_BONUS } from '@data/redesign/testParams';
import { autoBattleArtForRound, autoBattleRotation, ownedVolumes } from './volumes';

export interface SparRoundMove {
  artId?: string;
  volume?: number;
  moveName: string;
  power: number;
}

/** 一回合輪到一門外功，按實際已學卷次完整使出；無外功只用基本攻擊。 */
export function sparRoundMoves(c: LifeCharacter, rotationTurn: number): SparRoundMove[] {
  const artId = autoBattleArtForRound(c, rotationTurn + 1);
  if (!artId) return [{ moveName: '基本攻擊', power: 1 }];
  const stars = c.manualStars?.[artId] ?? 0;
  return ownedVolumes(c, artId).map(volume => {
    const move = volumeMove(artId, volume)!;
    return { artId, volume, moveName: move.name, power: move.power * (1 + MANUAL_STAR_BONUS * stars) };
  });
}

function loadoutKey(c: LifeCharacter): string {
  return JSON.stringify(autoBattleRotation(c).map(id => [id, ownedVolumes(c, id), c.manualStars?.[id] ?? 0]));
}

/** 演武回合游標：一次起手只結算一次，全部已學招式收勢後才輪到敵人。 */
export class SparRounds {
  round = 1;
  phase: 'hero' | 'foe' = 'hero';
  private rotationTurn = 0;
  private cursor = 0;
  private plan: SparRoundMove[] | null = null;
  private signature = '';
  private active: SparRoundMove | null = null;

  /** 已排定的當前招式；結算後清空，重送同一次命中不會再推游標。 */
  get activeMove(): SparRoundMove | null { return this.active; }

  /** 只在回合開始排招，切頁不改順序；換冊／換裝則下一完整回合採用新武學。 */
  updateLoadout(c: LifeCharacter): void {
    const key = loadoutKey(c);
    if (this.signature === key) return;
    if (this.plan && this.cursor > 0) this.phase = 'foe';
    this.signature = key;
    this.plan = null;
    this.active = null;
    this.cursor = 0;
  }

  /** 起手先固定這招身份，直到真正命中結算；未輪到主角則不排招。 */
  beginMove(c: LifeCharacter): SparRoundMove | null {
    this.updateLoadout(c);
    if (this.phase !== 'hero') return null;
    this.plan ??= sparRoundMoves(c, this.rotationTurn);
    this.active ??= this.plan[this.cursor] ?? null;
    return this.active;
  }

  /** 只認領一次真正命中；末招之後等待敵人一次還擊。 */
  commitHeroMove(): boolean {
    if (this.phase !== 'hero' || !this.active || !this.plan) return false;
    this.active = null;
    this.cursor++;
    if (this.cursor >= this.plan.length) this.phase = 'foe';
    return true;
  }

  /** 敵人還擊結算一次才開下一回合，不受播放速度影響。 */
  commitFoeMove(): boolean {
    if (this.phase !== 'foe') return false;
    this.round++;
    this.rotationTurn++;
    this.phase = 'hero';
    this.cursor = 0;
    this.plan = null;
    this.active = null;
    return true;
  }

  /** 敵人中途倒下立即收束，換敵人不把剩餘招式打到下一人。 */
  nextOpponent(): void {
    if (this.cursor > 0 || this.active) this.rotationTurn++;
    this.round = 1;
    this.phase = 'hero';
    this.cursor = 0;
    this.plan = null;
    this.active = null;
  }

  /** 敗退從同一關重新開始，沒有任何獎勵或存檔寫入。 */
  reset(): void {
    this.nextOpponent();
    this.rotationTurn = 0;
  }
}
