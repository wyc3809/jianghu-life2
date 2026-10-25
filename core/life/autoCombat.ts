/**
 * 自動戰鬥（玩家決定 2026-10-07：全部交手都自動）。
 * 每回合輪一門已裝備外功，起手只扣一次內力，已得卷次按序連出；
 * 內力不足先換另一門，全部不足先調息，不追加普攻。整次行動後敵人還手。
 * 生死戰要先確認（needsLifeOrDeathConfirm）先會開打；打完如果要處置敵人，照舊停喺 resolve 畀玩家揀。
 * 返回逐招紀錄，畀介面逐招扣血、出特效。
 */
import type { CombatReplay, CombatReplayHit, LifeGameState } from '@interfaces/lifeEngine';
import { BASIC_STRIKE } from '@data/skills/catalog';
import { martialTurnPlan } from './martialTurn';
import { getInternalMode } from './internalMode';
import { turnQiRegen } from './combatCore';
import { needsLifeOrDeathConfirm, playerCombatTurn } from './combat';
import { autoBattleArt, autoBattleRotation, ownedVolumes } from './volumes';

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
    const mode=getInternalMode(combat.player.internalMode);
    const upkeep=mode&&combat.player.qi>=mode.qiCostPerTurn ? mode.qiCostPerTurn : 0;
    const modeRegen=upkeep&&mode?.effects.qiRegenBonus ? Math.round(mode.effects.qiRegenBonus*10) : 0;
    const action = martialTurnPlan(state.character, Math.min(combat.player.maxQi, combat.player.qi-upkeep+modeRegen+turnQiRegen(combat.player)), round, combat.player.maxQi);
    const plan = combat.player.stun > 0 ? [{ skillId: undefined, vol: undefined, move: BASIC_STRIKE }] : action.moves.map((item,i) => ({ ...item, move: { ...item.move, qiCost: i === 0 ? action.cost : 0 } }));
    const hits: AutoHit[] = [];
    for (let i = 0; i < plan.length; i++) {
      const p = plan[i]!;
      const last = i === plan.length - 1;
      const foeBefore = combat.foe.hp;
      const turnBefore=combat.turn;
      let own={playerHp:combat.player.hp,foeHp:combat.foe.hp,skipped:false};
      const lines = playerCombatTurn(state, p.move.id, {
        chained: i > 0,
        skipEnemy: !last,
        ignoreCooldown: true,
        moveOverride: p.move,
        onPlayerResolved: hp=>{own=hp;},
      });
      res.lines.push(...lines);
      // 特性觸發分邊：鐵布衫／反震跟玩家呢招；蓄力／狂怒／噬血／連擊跟敵人還手
      const fx = combat.lastTraitFx ?? [];
      const onPlayer = fx.filter((f) => f.kind === 'guard' || f.kind === 'thorns');
      const onFoe = fx.filter((f) => f.kind !== 'guard' && f.kind !== 'thorns');
      const enemyActed = last && (combat.turn>turnBefore || (combat.phase as string)==='enemy' || combat.player.hp!==own.playerHp || combat.foe.hp!==own.foeHp);
      const foeHpAfterPlayer = Math.max(0, own.foeHp);
      hits.push({
        side: 'player',
        moveName: own.skipped ? '穴道受制' : p.move.name,
        vol: p.vol,
        skillId: p.skillId,
        damage: Math.max(0, Math.round(foeBefore - foeHpAfterPlayer)),
        playerHp: Math.max(0, own.playerHp),
        foeHp: foeHpAfterPlayer,
        ...(onPlayer.length ? { traitFx: onPlayer } : {}),
      });
      if (enemyActed) {
        hits.push({
          side: 'foe',
          moveName: combat.foe.hp<=0 && own.foeHp>0 ? '流血' : combat.foe.stunProtected && combat.phase==='player' ? '穴道受制' : combat.lastFoeMoveName ?? '出手',
          damage: Math.max(0, Math.round(own.playerHp - combat.player.hp)),
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
