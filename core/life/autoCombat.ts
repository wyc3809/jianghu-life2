/**
 * 自動戰鬥（玩家決定 2026-10-07：全部交手都自動）。
 * 每回合：輪到嗰門外功已得嘅卷（一卷＝一招）按卷序逐招出，內力唔夠嗰招就跳過；
 * 招式出完再補一下普通攻擊。全部出完先到敵人還手一次。
 * 生死戰要先確認（needsLifeOrDeathConfirm）先會開打；打完如果要處置敵人，照舊停喺 resolve 畀玩家揀。
 * 返回逐招紀錄，畀介面逐招扣血、出特效。
 */
import type { CombatReplay, CombatReplayHit, LifeGameState } from '@interfaces/lifeEngine';
import { BASIC_STRIKE } from '@data/skills/catalog';
import { needsLifeOrDeathConfirm, playerCombatTurn } from './combat';
import { autoBattleArt, autoBattleMoves, autoBattleRotation, ownedVolumes } from './volumes';

/** 自動戰鬥最多打幾多回合（防止無限拉鋸；到咗就照常由引擎判） */
export const AUTO_COMBAT_MAX_ROUNDS = 40;

export type AutoHit = CombatReplayHit;
export type AutoRound = CombatReplay['rounds'][number];
export interface AutoCombatResult extends CombatReplay {
  /** 引擎原本嘅文字紀錄（結果頁用） */
  lines: string[];
}

function artInfo(state: LifeGameState): Pick<CombatReplay, 'artId' | 'vols' | 'arts'> {
  const c = state.character;
  const art = autoBattleArt(c);
  if (!art) return {};
  return {
    artId: art,
    vols: ownedVolumes(c, art),
    arts: autoBattleRotation(c).map((id) => ({ id, vols: ownedVolumes(c, id) })),
  };
}

/**
 * 由而家嘅交手一路自動打到完（或者到要玩家處置敵人）。
 * 會直接改 state（喺 immer draft 入面叫）。
 */
export function runAutoCombat(state: LifeGameState): AutoCombatResult | null {
  const combat = state.pendingCombat;
  if (!combat || combat.phase !== 'player' || needsLifeOrDeathConfirm(combat)) return null;
  const res: AutoCombatResult = {
    title: combat.title,
    playerName: combat.player.name,
    foeName: combat.foe.name,
    playerMaxHp: combat.player.maxHp,
    foeMaxHp: combat.foe.maxHp,
    startPlayerHp: combat.player.hp,
    startFoeHp: combat.foe.hp,
    foeBoss: combat.foePower === 'boss',
    foeTier: combat.foeTier,
    foeTrait: combat.foeTrait,
    foeTitle: combat.foeTitle,
    ...artInfo(state),
    rounds: [],
    lines: [],
    outcome: 'ended',
  };

  for (let round = 1; round <= AUTO_COMBAT_MAX_ROUNDS; round++) {
    if (state.pendingCombat !== combat || combat.phase !== 'player') break;
    const all = autoBattleMoves(state, round);
    // 內力夠先出（按卷序，邊出邊扣）
    let qi = combat.player.qi;
    const usable = all.filter((m) => {
      if (qi < m.move.qiCost) return false;
      qi -= m.move.qiCost;
      return true;
    });
    // 招式出完再補一下普通攻擊（玩家決定 2026-10-09：例如兩招＝a 招 → b 招 → 普攻）；冇招就淨係普攻
    const basic = { skillId: undefined as string | undefined, vol: undefined as number | undefined, move: BASIC_STRIKE };
    const plan = [...usable, basic];
    const hits: AutoHit[] = [];
    for (let i = 0; i < plan.length; i++) {
      const p = plan[i]!;
      const last = i === plan.length - 1;
      const foeBefore = combat.foe.hp;
      const playerBefore = combat.player.hp;
      const lines = playerCombatTurn(state, p.move.id, {
        chained: i > 0,
        skipEnemy: !last,
        ignoreCooldown: true,
      });
      res.lines.push(...lines);
      // 特性觸發分邊：鐵布衫／反震跟玩家呢招；蓄力／狂怒／噬血／連擊跟敵人還手
      const fx = combat.lastTraitFx ?? [];
      const onPlayer = fx.filter((f) => f.kind === 'guard' || f.kind === 'thorns');
      const onFoe = fx.filter((f) => f.kind !== 'guard' && f.kind !== 'thorns');
      // 反震係玩家自己呢招扣嘅血，唔好算落敵人還手
      const reflected = onPlayer.filter((f) => f.kind === 'thorns').reduce((n, f) => n + f.value, 0);
      const playerAfterOwn = playerBefore - reflected;
      const enemyActed = last && combat.phase === 'player' && state.pendingCombat === combat;
      // 敵人還手之前嘅氣血變化計落玩家呢招；還手造成嘅另計
      const foeHpAfterPlayer = Math.max(0, combat.foe.hp);
      hits.push({
        side: 'player',
        moveName: p.move.name,
        vol: p.vol,
        skillId: p.skillId,
        damage: Math.max(0, Math.round(foeBefore - foeHpAfterPlayer)),
        playerHp: enemyActed ? playerAfterOwn : Math.max(0, combat.player.hp),
        foeHp: foeHpAfterPlayer,
        ...(onPlayer.length ? { traitFx: onPlayer } : {}),
      });
      if (enemyActed || (last && combat.player.hp < playerAfterOwn)) {
        hits.push({
          side: 'foe',
          moveName: combat.lastFoeMoveName ?? '出手',
          damage: Math.max(0, Math.round(playerAfterOwn - combat.player.hp)),
          playerHp: Math.max(0, combat.player.hp),
          foeHp: Math.max(0, combat.foe.hp),
          ...(onFoe.length ? { traitFx: onFoe } : {}),
        });
      }
      if (state.pendingCombat !== combat || combat.phase !== 'player') break;
    }
    res.rounds.push({ round, hits });
  }

  if (state.pendingCombat === combat && (combat.phase as string) === 'resolve') res.outcome = 'resolve';
  else if (!state.pendingCombat) {
    res.outcome = combat.foe.hp <= 0 ? 'won' : combat.player.hp <= 0 ? 'lost' : 'ended';
  }
  return res;
}
