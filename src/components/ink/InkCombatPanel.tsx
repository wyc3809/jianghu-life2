import { useEffect, useRef, useState } from 'react';
import type { LifeGameState, PendingCombat } from '@interfaces/lifeEngine';
import {
  type CombatFoeDisposition,
  getPlayerInternalModeOptions,
  getPlayerMoves,
  getMoveCooldownRemaining,
} from '@core/life/combat';
import {
  buildCombatInkFx,
  combatFxNeedsShock,
  snapCombatVitals,
  type CombatVitalsSnap,
} from '@core/life/combatInkFx';
import { InkBarWithGhost, InkCombatFxLayer, useInkCombatFxQueue } from './InkCombatFx';
import { MOVE_STANCE_LABEL, resolveMoveStance, stanceBeats, type MoveStance } from '@core/life/moveStance';
import {
  COMBAT_TECHNIQUE_ROLES,
  combatMoveRole,
  formatCombatMoveCompact,
  getSkillDef,
  isCombatActionMove,
  REST_HEAL_MOVE,
  REST_QI_MOVE,
  REST_STAMINA_MOVE,
  GUARD_STANCE,
  CHARGE_STANCE,
  FLEE_MOVE,
  DESPERATE_BURN_MOVE,
  DESPERATE_SURRENDER_MOVE,
  type CombatMoveRole,
} from '@data/skills/catalog';
import { getGearDef, WEAPON_KIND_LABEL } from '@data/equipment/catalog';
import { rankPowerMult } from '@core/life/martialRanks';
import { classifyBeat, summarizeExchange, styleForCombat } from '@core/life/combatPresentation';
import { foeStyleLabel } from '@core/life/foeAi';
import { dominantNature } from '@core/life/nature';
import { playInkBlade } from '../../audio/inkAudio';

type CombatRoleFilter = 'all' | CombatMoveRole;

type Props = {
  state: LifeGameState;
  combat: PendingCombat;
  onMove: (moveId: string) => void;
  onResolveFoe: (disposition: CombatFoeDisposition) => void;
  onSetInternalMode: (modeId: string | null) => void;
};

/** 血條下「最新戰況」：取自己／敵人各最近一條主動作（最多兩條） */
function recentExchangeBeats(log: string[], playerName: string, foeName: string): string[] {
  let playerIdx = -1;
  let foeIdx = -1;
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const line = log[i]!;
    if (line.startsWith('【')) continue;
    const isAction =
      line.includes('「') ||
      /收招守中|蓄勢待發|抽身|使不出來|截住去路|動作遲滯|氣息陡變/.test(line);
    if (!isAction) continue;
    if (playerIdx < 0 && (line.startsWith(playerName) || line.startsWith('你'))) {
      playerIdx = i;
    } else if (foeIdx < 0 && line.startsWith(foeName)) {
      foeIdx = i;
    }
    if (playerIdx >= 0 && foeIdx >= 0) break;
  }
  const idxs = [playerIdx, foeIdx].filter((i) => i >= 0).sort((a, b) => a - b);
  if (idxs.length) return idxs.map((i) => log[i]!);
  return log.filter((l) => !l.startsWith('【')).slice(-2);
}

export function InkCombatPanel({ state, combat, onMove, onResolveFoe, onSetInternalMode }: Props) {
  const c = state.character;
  const dominant = dominantNature(c);
  const equipment = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const equippedWeapon = equipment.weapon ? getGearDef(equipment.weapon) : undefined;

  const [combatRoleFilter, setCombatRoleFilter] = useState<CombatRoleFilter>('all');
  const [combatLogOpen, setCombatLogOpen] = useState(false);
  const [combatFiltersOpen, setCombatFiltersOpen] = useState(false);
  const [combatActionsOpen, setCombatActionsOpen] = useState(false);
  const [expandedMoveId, setExpandedMoveId] = useState<string | null>(null);
  const combatBeatRef = useRef<HTMLDivElement | null>(null);
  const lastCombatTurn = useRef<number | null>(null);
  const combatVitalsRef = useRef<CombatVitalsSnap | null>(null);
  const pendingMoveMeta = useRef<{ name: string; stance: MoveStance } | null>(null);
  const { fx: combatFx, stanceBrush, shock: combatShock, pushFx, clearFx } = useInkCombatFxQueue();

  useEffect(() => {
    setCombatRoleFilter('all');
    setCombatLogOpen(false);
    setCombatFiltersOpen(false);
    setCombatActionsOpen(false);
    setExpandedMoveId(null);
  }, [combat.id]);

  useEffect(() => {
    if (!combat.log.length) return;
    window.requestAnimationFrame(() => {
      combatBeatRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });
  }, [combat.log.length]);

  useEffect(() => {
    if (lastCombatTurn.current !== null && lastCombatTurn.current !== combat.turn) {
      playInkBlade();
    }
    lastCombatTurn.current = combat.turn;
  }, [combat.turn]);

  useEffect(() => {
    const prev = combatVitalsRef.current;
    const meta = pendingMoveMeta.current;
    const nextSnap = snapCombatVitals(combat);
    const changed =
      !prev ||
      prev.playerHp !== nextSnap.playerHp ||
      prev.foeHp !== nextSnap.foeHp ||
      prev.playerQi !== nextSnap.playerQi ||
      prev.logLen !== nextSnap.logLen ||
      prev.turn !== nextSnap.turn;
    if (changed && (meta || prev)) {
      const items = buildCombatInkFx({
        prev,
        next: combat,
        moveName: meta?.name,
        stance: meta?.stance,
      });
      if (items.length || meta?.stance) {
        pushFx(items, {
          shock: combatFxNeedsShock(items),
          stance: meta?.stance,
        });
      }
    }
    pendingMoveMeta.current = null;
    combatVitalsRef.current = nextSnap;
  }, [combat, combat.id, combat.turn, combat.player.hp, combat.foe.hp, combat.player.qi, combat.log.length, clearFx, pushFx]);

  const enqueueCombatMove = (moveId: string, name: string, stance: MoveStance) => {
    combatVitalsRef.current = snapCombatVitals(combat);
    pendingMoveMeta.current = { name, stance };
    onMove(moveId);
  };

  const moves = getPlayerMoves(state);
  const internalModeOptions = getPlayerInternalModeOptions(state);
  const techniqueMoves = moves.filter((mv) => !isCombatActionMove(mv.id));
  const actionMoves = moves.filter((mv) => isCombatActionMove(mv.id));
  const sortedTechniques = [...techniqueMoves].sort((a, b) => {
    const skillOf = (moveId: string) => c.skills.find((id) => getSkillDef(id)?.move?.id === moveId);
    const score = (mv: (typeof techniqueMoves)[number]) => {
      const short = combat.player.qi < mv.qiCost;
      const onCd = getMoveCooldownRemaining(combat, mv.id) > 0;
      const sid = skillOf(mv.id);
      const def = sid ? getSkillDef(sid) : undefined;
      const match = Boolean(def?.weaponKind && equippedWeapon?.weaponKind === def.weaponKind);
      let s = 0;
      if (!short && !onCd) s += 100;
      if (match) s += 40;
      if (mv.id === 'basic_strike') s += 10;
      s += (mv.power ?? 0) * 5;
      return s;
    };
    return score(b) - score(a);
  });
  const visibleTechniques =
    combatRoleFilter === 'all'
      ? sortedTechniques
      : sortedTechniques.filter((mv) => combatMoveRole(mv) === combatRoleFilter);
  const roleCounts = COMBAT_TECHNIQUE_ROLES.reduce(
    (acc, role) => {
      acc[role] = techniqueMoves.filter((mv) => combatMoveRole(mv) === role).length;
      return acc;
    },
    {} as Record<CombatMoveRole, number>,
  );
  const latestBeats = combat.log.length ? recentExchangeBeats(combat.log, combat.player.name, combat.foe.name) : [];
  const exchangeHint = summarizeExchange(latestBeats);
  const combatStyle = styleForCombat(combat);

  return (
    <section
      className={`ink-panel ink-combat ink-combat--focus${combatShock ? ' ink-combat--shock' : ''}${
        stanceBrush ? ` ink-combat--brush-${stanceBrush}` : ''
      }`}
      aria-live="polite"
    >
      <InkCombatFxLayer items={combatFx} stanceBrush={stanceBrush} />
      <div className="ink-combat-head">
        <p className="ink-event-year ink-event-year--combat">
          第 {combat.turn} 回合 · {combat.title}
          {combatStyle ? ` · ${foeStyleLabel(combatStyle)}` : ''}
          <span className="ink-combat-stance-brief" title="實克虛 · 架克實 · 虛克架">
            {' '}
            · 勢：實克虛／架克實／虛克架
          </span>
        </p>
        <h3>交手 · {combat.foe.name}</h3>
        {combat.lastPlayerStance && combat.lastFoeStance && (
          <div
            key={`stance-${combat.turn}`}
            className="ink-combat-stance-row"
            aria-label="雙方架勢"
          >
            <span
              className={`ink-combat-stance-stamp ink-combat-stance-stamp--${
                stanceBeats(combat.lastPlayerStance, combat.lastFoeStance)
                  ? 'win'
                  : stanceBeats(combat.lastFoeStance, combat.lastPlayerStance)
                    ? 'lose'
                    : 'neutral'
              }`}
            >
              你｜{MOVE_STANCE_LABEL[combat.lastPlayerStance]}
            </span>
            <span className="ink-combat-stance-vs">對</span>
            <span
              className={`ink-combat-stance-stamp ink-combat-stance-stamp--${
                stanceBeats(combat.lastFoeStance, combat.lastPlayerStance)
                  ? 'win'
                  : stanceBeats(combat.lastPlayerStance, combat.lastFoeStance)
                    ? 'lose'
                    : 'neutral'
              }`}
            >
              {combat.foe.name}｜{MOVE_STANCE_LABEL[combat.lastFoeStance]}
            </span>
          </div>
        )}
        <div className="ink-combat-bars">
          <div>
            <div className="ink-vitals-label">
              <span>{combat.foe.name}</span>
              <span>
                氣血 {Math.round(combat.foe.hp)}/{combat.foe.maxHp}
              </span>
            </div>
            <InkBarWithGhost pct={(combat.foe.hp / combat.foe.maxHp) * 100} fillClass="ink-bar-fill--foe" active />
          </div>
          <div>
            <div className="ink-vitals-label">
              <span>{combat.player.name}</span>
              <span>
                氣血 {Math.round(combat.player.hp)}/{combat.player.maxHp} · 內力{' '}
                {Math.round(combat.player.qi)}/{combat.player.maxQi}
              </span>
            </div>
            <InkBarWithGhost pct={(combat.player.hp / combat.player.maxHp) * 100} fillClass="" active />
            <div className="ink-bar--qi">
              <InkBarWithGhost
                pct={(combat.player.qi / Math.max(1, combat.player.maxQi)) * 100}
                fillClass="ink-bar-fill--qi"
                active
              />
            </div>
          </div>
        </div>

        {latestBeats.length > 0 && (
          <div
            ref={combatBeatRef}
            key={`${combat.turn}-${latestBeats.map((b) => b.slice(0, 12)).join('|')}`}
            className="ink-combat-beat"
            aria-live="polite"
          >
            {exchangeHint && <p className="ink-combat-beat-hint">{exchangeHint}</p>}
            {latestBeats.map((beat, i) => {
              const kind = classifyBeat(beat);
              return (
                <p key={`${i}-${beat.slice(0, 16)}`} className={`ink-combat-beat-line ink-combat-beat-line--${kind}`}>
                  {beat}
                </p>
              );
            })}
          </div>
        )}
      </div>

      <div className="ink-combat-scroll">
        <button
          type="button"
          className="ink-combat-log-toggle"
          onClick={() => {
            setCombatLogOpen((v) => !v);
          }}
        >
          {combatLogOpen ? '收起紀要' : `交手紀要（${combat.log.length}）`}
        </button>
        {combatLogOpen && (
          <ul className="ink-combat-log">
            {combat.log.slice(-20).map((line, i) => (
              <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
            ))}
          </ul>
        )}

        {combat.phase === 'resolve' ? (
          <>
            <p className="ink-note">
              {combat.foeSurrendered
                ? '對方已跪地求饒——殺、放、廢其武功，如何抉擇，亦會留在心性裡。'
                : '勝負已分——如何處置落敗之人，亦會留在心性裡。'}
            </p>
            <div className="ink-choice-list ink-combat-resolve">
              {(
                [
                  ['kill', '殺', '殺死', '永絕後患，得修為；戾氣難消', dominant === 'xia' ? '俠心較重，下手需自問' : ''],
                  ['release', '放', '放走', '留其一命，寬恕在胸', dominant === 'e' ? '惡念未消，放人亦是克制' : ''],
                  ['stun', '暈', '擊暈', '點穴制住，不傷性命', '戰利或略薄，心性較穩'],
                  ...(combat.foeSurrendered
                    ? ([
                        ['cripple', '廢', '廢武功', '斷其根基，任其苟活', '較殺人留情，較放人狠絕'],
                      ] as const)
                    : []),
                ] as const
              ).map(([id, mark, label, hint, extra], i) => (
                <button
                  key={id}
                  type="button"
                  className="ink-choice"
                  style={{ ['--i' as string]: i }}
                  onClick={() => {
                    onResolveFoe(id);
                  }}
                >
                  <span className="ink-choice-mark">{mark}</span>
                  <span className="ink-combat-move">
                    <strong>{label}</strong>
                    <em>
                      {hint}
                      {extra ? ` · ${extra}` : ''}
                    </em>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {combat.player.hp / Math.max(1, combat.player.maxHp) < 0.2 && (
              <div className="ink-combat-desperate">
                <p className="ink-note ink-note--warn">氣血垂危——絕地反擊，孤注一擲：</p>
                <div className="ink-choice-list">
                  <button
                    type="button"
                    className="ink-choice ink-choice--desperate"
                    onClick={() => enqueueCombatMove(DESPERATE_BURN_MOVE.id, DESPERATE_BURN_MOVE.name, 'shi')}
                  >
                    <span className="ink-choice-mark">拚</span>
                    <span className="ink-combat-move">
                      <strong>燃燒真氣</strong>
                      <em>下招威能 ×2.5，戰後必留內傷</em>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="ink-choice ink-choice--desperate"
                    onClick={() => enqueueCombatMove(DESPERATE_SURRENDER_MOVE.id, DESPERATE_SURRENDER_MOVE.name, 'xu')}
                  >
                    <span className="ink-choice-mark">棄</span>
                    <span className="ink-combat-move">
                      <strong>棄劍認輸</strong>
                      <em>保住性命，名望－5</em>
                    </span>
                  </button>
                </div>
              </div>
            )}

            <p className="ink-combat-group-label">內功運轉</p>
            <div className="ink-combat-mode-bar" role="tablist" aria-label="內功運轉模式">
              {internalModeOptions.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`ink-combat-mode-btn${combat.player.internalMode === mode.id ? ' ink-combat-mode-btn--on' : ''}`}
                  title={
                    mode.qiCostPerTurn > 0
                      ? `${mode.description} · 每回合耗內力${mode.qiCostPerTurn}`
                      : mode.description
                  }
                  onClick={() => {
                    onSetInternalMode(combat.player.internalMode === mode.id ? null : mode.id);
                  }}
                >
                  {mode.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="ink-combat-log-toggle"
              onClick={() => {
                setCombatFiltersOpen((v) => !v);
              }}
            >
              {combatFiltersOpen ? '收起擇勢' : '擇勢觀招'}
            </button>
            {combatFiltersOpen && (
              <>
                <p className="ink-note">按路數分覽；兵刃相合、內息充足者居前。</p>
                <div className="ink-combat-filters" role="tablist" aria-label="擇勢觀招">
                  <button
                    type="button"
                    className={`ink-combat-filter${combatRoleFilter === 'all' ? ' ink-combat-filter--on' : ''}`}
                    onClick={() => {
                      setCombatRoleFilter('all');
                    }}
                  >
                    全部 {techniqueMoves.length}
                  </button>
                  {COMBAT_TECHNIQUE_ROLES.filter((role) => (roleCounts[role] ?? 0) > 0).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`ink-combat-filter${combatRoleFilter === role ? ' ink-combat-filter--on' : ''}`}
                      onClick={() => {
                        setCombatRoleFilter(role);
                      }}
                    >
                      {role} {roleCounts[role]}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="ink-combat-group-label">招式</p>
            <div className="ink-choice-list ink-combat-moves">
              {visibleTechniques.map((mv, i) => {
                const short = combat.player.qi < mv.qiCost;
                const cdLeft = getMoveCooldownRemaining(combat, mv.id);
                const onCd = cdLeft > 0;
                const ownerSkill = c.skills.find((id) => getSkillDef(id)?.move?.id === mv.id);
                const rank = ownerSkill ? (c.skillRanks?.[ownerSkill] ?? 0) : 0;
                const effPower = mv.power * (ownerSkill ? rankPowerMult(rank) : 1);
                const role = combatMoveRole(mv);
                const stance = resolveMoveStance(mv);
                const def = ownerSkill ? getSkillDef(ownerSkill) : undefined;
                const matched = Boolean(def?.weaponKind && equippedWeapon?.weaponKind === def.weaponKind);
                const expanded = expandedMoveId === mv.id;
                return (
                  <div key={mv.id} className="ink-combat-move-row">
                    <button
                      type="button"
                      className={`ink-choice ink-choice--compact ink-choice--stance-${stance}${matched ? ' ink-choice--match' : ''}`}
                      disabled={combat.phase !== 'player' || short || onCd}
                      style={{ ['--i' as string]: i }}
                      onClick={() => {
                        enqueueCombatMove(mv.id, mv.name, stance);
                      }}
                    >
                      <span className="ink-choice-mark" title={`屬性${MOVE_STANCE_LABEL[stance]} · ${role}`}>
                        {MOVE_STANCE_LABEL[stance]}
                      </span>
                      <span className="ink-combat-move">
                        <strong>
                          {mv.name}
                          {matched ? ' · 兵刃契' : ''}
                          {short ? ' · 內息不足' : ''}
                          {onCd ? ` · 冷卻${cdLeft}回合` : ''}
                        </strong>
                        <em className="ink-combat-move-meta">{formatCombatMoveCompact(mv, effPower, cdLeft)}</em>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="ink-combat-detail-btn"
                      aria-expanded={expanded}
                      onClick={() => {
                        setExpandedMoveId(expanded ? null : mv.id);
                      }}
                    >
                      {expanded ? '收' : '詳'}
                    </button>
                    {expanded && (
                      <p className="ink-combat-move-detail">
                        {mv.description}
                        {ownerSkill && rank > 0 ? ' · 階位加持' : ''}
                        {def?.weaponKind ? ` · 宜${WEAPON_KIND_LABEL[def.weaponKind] ?? def.weaponKind}` : ''}
                      </p>
                    )}
                  </div>
                );
              })}
              {visibleTechniques.length === 0 && <p className="ink-note">此路暫無招式，可回「全部」再觀。</p>}
            </div>

            <div className="ink-combat-actions">
              <button
                type="button"
                className="ink-combat-log-toggle"
                aria-expanded={combatActionsOpen}
                onClick={() => {
                  setCombatActionsOpen((v) => !v);
                }}
              >
                {combatActionsOpen ? '收起行動' : '行動（守／蓄／調／遁）'}
              </button>
              {combatActionsOpen && (
                <div className="ink-combat-action-bar">
                  {actionMoves.map((mv) => {
                    const short = combat.player.qi < mv.qiCost;
                    const cdLeft = getMoveCooldownRemaining(combat, mv.id);
                    const onCd = cdLeft > 0;
                    const mark =
                      mv.id === GUARD_STANCE.id
                        ? '守'
                        : mv.id === CHARGE_STANCE.id
                          ? '蓄'
                          : mv.id === FLEE_MOVE.id
                            ? '遁'
                            : mv.id === REST_QI_MOVE.id
                              ? '息'
                              : mv.id === REST_STAMINA_MOVE.id
                                ? '神'
                                : mv.id === REST_HEAL_MOVE.id
                                  ? '血'
                                  : '調';
                    const stance = resolveMoveStance(mv);
                    const actionHint =
                      mv.id === GUARD_STANCE.id
                        ? '架 · 回息守中'
                        : mv.id === CHARGE_STANCE.id
                          ? `虛 · 耗${mv.qiCost} · 下一擊加威`
                          : mv.id === FLEE_MOVE.id
                            ? '虛 · 伺機離場'
                            : mv.id === REST_QI_MOVE.id
                              ? `虛 · 回內${mv.qiSelf ?? 0}${mv.cooldown ? ` · CD${mv.cooldown}` : ''}`
                              : mv.id === REST_STAMINA_MOVE.id
                                ? `虛 · 回體${mv.staminaSelf ?? 0}${mv.cooldown ? ` · CD${mv.cooldown}` : ''}`
                                : mv.id === REST_HEAL_MOVE.id
                                  ? `架 · 回血${mv.healSelf ?? 0}${mv.cooldown ? ` · CD${mv.cooldown}` : ''}`
                                  : mv.description;
                    return (
                      <button
                        key={mv.id}
                        type="button"
                        className={`ink-combat-action ink-choice--stance-${stance}`}
                        disabled={combat.phase !== 'player' || short || onCd}
                        title={`${mv.description} · ${MOVE_STANCE_LABEL[stance]}`}
                        onClick={() => {
                          enqueueCombatMove(mv.id, mv.name, stance);
                        }}
                      >
                        <strong>
                          {MOVE_STANCE_LABEL[stance]}·{mark} {mv.name}
                          {onCd ? ` · 冷卻${cdLeft}` : ''}
                        </strong>
                        <span>
                          {actionHint}
                          {short ? ' · 不足' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
