import { martialPoseFor } from '../../fx/art/martialPoses';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { CombatReplay, CombatReplayHit, LifeCharacter } from '@interfaces/lifeEngine';
import { appearanceOf, readAppearance } from '@interfaces/appearance';
import { canonicalSkillId, getSkillDef } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { VOLUME_COUNT, VOLUME_NUMERALS, artVolumeMoves, replayArtAt } from '@data/skills/volumes';
import { SparStage, loadSparImage, loadSparImages, loadSparUiImages, type SparCombatHooks } from '../../spar/engine';
import { ENEMY_POOL, SPAR_BACKGROUNDS, WEAPON_SPRITES, rigForSect } from '../../spar/rig';
import { formatSparNumber } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';
import { useLifeStore } from '../../store/lifeStore';
import { FOE_TRAITS } from '@data/foes/traits';
import { FOE_BY_NAME } from '@data/foes/roster';
import { sparLookForName } from '@core/life/sparDuel';
import { InkUnifiedBattleFrame } from './InkUnifiedBattleFrame';
import { InkBattleArts } from './InkBattleArts';
import { InkBattleEntrance } from './InkBattleEntrance';
import type { SparSeason } from '../../spar/presentation';
import { playInkDefeat, playInkMiss, playInkVictory } from '../../audio/inkAudio';
import { loadMartialAssets } from '../../fx/art/martialPoses';
import { equippedMartialArts } from '@core/life/martialLoadout';

const STAGE_HEIGHT = 230;
const COIN_SRC = `${import.meta.env.BASE_URL || '/'}ink/spar/fx-coin.webp`;
/** 成場演出最長幾耐（ms）：超時就當播完，唔好卡住玩家——測試參數 */
export const AUTO_BATTLE_MAX_MS = 45_000;

type Props = {
  /** 多人戰報用伺服器快照，唔借用或寫入本機人生角色。 */
  character?: LifeCharacter;
  /** 只有真實核心已派嘅獎勵先顯示；多人排名切磋傳0。 */
  rewardCoins?: number;
  /** 只限 DEV 驗收；正式入口永遠唔傳，唔寫存檔。 */
  review?: { speed: number; effectsOff: boolean; monochrome: boolean; legacy: boolean;
    supports?: string[]; onStage?: (stage: SparStage) => void; inspect?: { id: string; t: number } };
  /** 第26項原型開關，正式入口預設仍維持原畫面。 */
  unified?: boolean;
  season?: SparSeason;
  notice?: ReactNode;
  battleBackdropSrc?: string;
  replay: CombatReplay;
  /** 演完（或者撳跳過） */
  onDone: () => void;
  reduceMotion?: boolean;
};

/** 純狀態行動留有閱讀節拍，不播放攻擊或落空聲。 */
const passiveAction = (hit: {moveName:string}) => /^(調息|穴道受制|流血)$/.test(hit.moveName);

type Hit = CombatReplayHit & { round: number };

/** 按敵人名揀剪影（首領用鐵面／赤髮大隻款），同一個名每次一樣 */
/** 敵人剪影：圖鑑有就用圖鑑；否則按名字關鍵字（同演武台同一套） */
function foeLook(name: string, _boss: boolean): number {
  return sparLookForName(name);
}

/** 場景：首領夜山、論劍山門、其餘山路 */
function sceneOf(replay: CombatReplay): string {
  if (/論劍|華山/.test(replay.title)) return 'gate';
  if (replay.foeBoss) return 'nightpeak';
  return 'road';
}

/**
 * 自動交手演出（玩家要求 2026-10-07：同演武台一樣嘅動畫）。
 * 直接用演武台引擎（src/spar/engine.ts）：俠客行過去你一刀我一刀，墨濺、震屏、傷害數字、頭頂墨筆血條；
 * 出招次序同傷害照自動戰鬥紀錄（core/life/autoCombat.ts）逐招播。
 * 下面主修外功七卷：已得嘅卷亮起，輪到嗰卷發紅；頭頂彈「卷幾・招名」。
 */
export function InkAutoBattle({ replay, onDone, reduceMotion = false, unified = false, season = 'spring', notice, battleBackdropSrc, review, character, rewardCoins = 6 }: Props) {
  const reviewRef = useRef(import.meta.env.DEV ? review : undefined);
  reviewRef.current = import.meta.env.DEV ? review : undefined;
  const hits = useMemo<Hit[]>(
    () => replay.rounds.flatMap((r) => r.hits.map((h) => ({ ...h, round: r.round }))),
    [replay],
  );
  const [fast, setFast] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [entered, setEntered] = useState(!unified);
  const enteredRef = useRef(!unified);
  const speedRef = useRef(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const heroBarRef = useRef<HTMLDivElement | null>(null);
  const foeBarRef = useRef<HTMLDivElement | null>(null);
  const calloutRef = useRef<HTMLDivElement | null>(null);
  const [cur, setCur] = useState<{ hit: Hit; n: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (unified) setSceneReady(true);
    if (unified && hits.length) setCur({ hit: hits[hits.length - 1]!, n: hits.length });
    onDoneRef.current();
  };

  const localSectId = useLifeStore((s) => s.state?.character.sectId ?? null);
  const localWeaponId = useLifeStore((s) => s.state?.character.equipment.weapon ?? null);
  const sectId = character ? character.sectId ?? null : localSectId;
  const weaponId = character ? character.equipment.weapon ?? null : localWeaponId;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    let stage: SparStage | null = null;
    let raf = 0;
    let last = 0;
    let cancelled = false;
    let endTimer: ReturnType<typeof setTimeout> | null = null;
    let i = 0;
    let ended = false;
    let enraged = false;
    let supportHold = 0;
    const end = (ms: number) => {
      if (ended) return;
      ended = true;
      if (replay.outcome === 'lost') playInkDefeat();
      else if (replay.outcome !== 'ended') playInkVictory();
      endTimer = setTimeout(finish, ms);
    };
    const show = (h: Hit) => {
      setCur({ hit: h, n: i });
      if (h.damage <= 0 && !passiveAction(h)) playInkMiss();
    };
    const combat: SparCombatHooks = {
      heroMayAttack: () => !ended && supportHold<=0 && hits[i]?.side === 'player' && !passiveAction(hits[i]),
      // 第 25 項：今回合用邊套外功就播嗰套專屬動畫
      nextArt: () => (hits[i]?.side === 'player' ? (hits[i]?.skillId ?? null) : null),
      foeMayAttack: () => !ended && supportHold<=0 && hits[i]?.side === 'foe' && !passiveAction(hits[i]),
      heroStrike: () => {
        const h = hits[i];
        if (!h || h.side !== 'player') return { dmg: 0, crit: false, heal: 0, killed: false };
        i += 1;
        show(h);
        const killed = h.foeHp <= 0;
        if (!killed && i >= hits.length) end(1200);
        const fx = h.traitFx ?? [];
        const reflect = fx.filter((f) => f.kind === 'thorns').reduce((n, f) => n + f.value, 0);
        return { dmg: h.damage, crit: h.damage > 0 && h.crit === true, heal: 0, killed, fx, reflect };
      },
      foeStrike: () => {
        const h = hits[i];
        if (!h || h.side !== 'foe') return { dmg: 0, heroDown: false };
        i += 1;
        show(h);
        const heroDown = h.playerHp <= 0;
        if (!heroDown && i >= hits.length) end(1200);
        const fx = h.traitFx ?? [];
        if (fx.some((f) => f.kind === 'enrage')) enraged = true;
        const foeHeal = fx.filter((f) => f.kind === 'drain').reduce((n, f) => n + f.value, 0);
        return { dmg: h.damage, heroDown, fx, foeHeal };
      },
      nextFoe: () => ({
        boss: Boolean(replay.foeBoss),
        look: foeLook(replay.foeName, Boolean(replay.foeBoss)),
        tier: replay.foeTier,
        trait: replay.foeTrait,
        accent: FOE_BY_NAME.get(replay.foeName)?.entry.accent ?? (replay.foeTrait ? FOE_TRAITS[replay.foeTrait].rgb : undefined),
      }),
      // 下一下敵人出手係蓄力重擊 → 光環暴漲預告
      foeCharging: () => hits[i]?.side === 'foe' && Boolean(hits[i]?.traitFx?.some((f) => f.kind === 'charge')),
      foeEnraged: () => enraged,
      foeDefeated: () => {
        end(700);
        return { coins: rewardCoins };
      },
      heroRecovered: () => end(200),
    };

    const placeBars = () => {
      if (!stage || unified) return;
      const a = stage.getAnchors();
      const w = wrap.clientWidth;
      const hb = heroBarRef.current;
      if (hb) {
        const left = Math.max(6, a.heroX + 18 - hb.offsetWidth);
        hb.style.transform = `translate(${left.toFixed(1)}px, ${(a.heroHeadY - 12).toFixed(1)}px)`;
      }
      const fb = foeBarRef.current;
      if (fb) {
        if (a.foeX === null) fb.style.opacity = '0';
        else {
          fb.style.opacity = '1';
          const left = Math.min(a.foeX - 18, w - fb.offsetWidth - 6);
          fb.style.transform = `translate(${left.toFixed(1)}px, ${(a.foeHeadY - fb.offsetHeight - 30).toFixed(1)}px)`;
        }
      }
    };
    const frame = (now: number) => {
      if (!stage || cancelled || doneRef.current) return;
      const qa = reviewRef.current;
      if (qa) stage.setMartialReview(qa.effectsOff, qa.monochrome);
      if (qa?.inspect) {
        stage.inspectMartialPose(qa.inspect.id, qa.inspect.t);
        stage.render(); last = now; raf = requestAnimationFrame(frame); return;
      }
      stage.inspectMartialPose(null);
      if (unified && !enteredRef.current) {
        last = now;
        stage.render();
        raf = requestAnimationFrame(frame);
        return;
      }
      // 全屏喺低幀率裝置亦追返播放時間；更新仍分小步，唔跳過命中。
      const dt = last ? Math.min(unified ? 0.15 : 0.05, (now - last) / 1000) : 0;
      last = now;
      supportHold = Math.max(0,supportHold-dt*speedRef.current);
      const pending=hits[i];
      if(!ended && pending && passiveAction(pending) && supportHold<=0 && !stage.heroAttackActive && !stage.foeAttackActive) {
        i++;show(pending);supportHold=.9;
        if(pending.foeHp<=0)stage.foeFellFromStatus();
        if(i>=hits.length)end(900);
      }
      // 兩倍播放推相同小步，唔因dt夾值令加速冇效或改命中結算。
      if (unified) {
        let budget = dt * (qa?.speed ?? speedRef.current);
        while (budget > 1e-9) { const step = Math.min(1 / 60, budget); stage.update(step); budget -= step; }
      } else stage.update(dt);
      stage.render();
      placeBars();
      raf = requestAnimationFrame(frame);
    };

    const rig = rigForSect(sectId);
    loadSparImages(rig, ENEMY_POOL)
      .then(async (images) => {
        images.ui = await loadSparUiImages();
        images.coin = await loadSparImage(COIN_SRC).catch(() => null);
        const battleBackdrop = unified && battleBackdropSrc ? await loadSparImage(battleBackdropSrc).catch(() => null) : null;
        const actor = character ?? useLifeStore.getState().state?.character;
        images.characterAppearance = replay.playerAppearance ? readAppearance(replay.playerAppearance) : appearanceOf(actor ?? {});
        images.opponentAppearance = replay.foeAppearance ? readAppearance(replay.foeAppearance) : undefined;
        images.opponentFamily = martialPoseFor(hits.find(h=>h.side==='foe')?.skillId)?.family ?? 'fist';
        const supports = reviewRef.current?.supports ?? (actor ? equippedMartialArts(actor).filter(id => getSkillDef(id)?.kind !== 'external') : []);
        const requested = [...hits.flatMap(h => h.skillId ? [canonicalSkillId(h.skillId)] : []), ...supports];
        const martialAssets = await loadMartialAssets(reviewRef.current?.legacy ? [] : requested);
        if (cancelled) return;
        stage = new SparStage({ canvas, images, rig, enemies: ENEMY_POOL, combat, uiFontFamily: unified ? getComputedStyle(canvas).fontFamily : undefined, presentation: unified ? 'battle' : 'stage', battleBackdrop });
        stage.setMartialAssets(martialAssets, supports);
        reviewRef.current?.onStage?.(stage);
        if (import.meta.env.DEV) (window as unknown as { __martialBattleStage?: SparStage }).__martialBattleStage = stage;
        if (unified) stage.setSeason(season);
        const rect = wrap.getBoundingClientRect();
        stage.resize(rect.width, unified ? rect.height : STAGE_HEIGHT, Math.min(window.devicePixelRatio || 1, 2.5));
        const kind = weaponId ? getGearDef(weaponId)?.weaponKind : undefined;
        const wdef = kind ? WEAPON_SPRITES[kind] : null;
        if (wdef) loadSparImage(wdef.src).then((img) => { if (!cancelled) stage?.setWeapon(wdef, img); }).catch(() => {});
        const scene = sceneOf(replay);
        const bg = SPAR_BACKGROUNDS[scene];
        stage.setAmbience(scene);
        if (bg) loadSparImage(bg.src).then((img) => { if (!cancelled) stage?.setBackground(img, bg.opacity ?? 1); }).catch(() => {});
        stage.setQuiet(reduceMotion);
        stage.settleIntro();
        if (unified) { stage.render(); setSceneReady(true); }
        if (!hits.length) end(800);
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {
        if (!cancelled) { setFailed(true); if (unified) setSceneReady(true); }
      });
    const observer = new ResizeObserver(() => {
      if (!stage) return;
      const rect = wrap.getBoundingClientRect();
      stage.resize(rect.width, unified ? rect.height : STAGE_HEIGHT, Math.min(window.devicePixelRatio || 1, 2.5));
    });
    if (unified) observer.observe(wrap);
    const cap = setTimeout(finish, reviewRef.current ? 10 * 60_000 : AUTO_BATTLE_MAX_MS);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (endTimer) clearTimeout(endTimer);
      clearTimeout(cap);
      observer.disconnect();
      stage?.releaseMartialAssets();
      if (import.meta.env.DEV) {
        const qa = window as unknown as { __martialBattleStage?: SparStage };
        if (qa.__martialBattleStage === stage) delete qa.__martialBattleStage;
      }
    };
    // 一場演出一個引擎：replay 變先重開
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay, unified, season, battleBackdropSrc, character, rewardCoins]);

  // 素材載唔到：唔好卡住，直接當播完
  useEffect(() => {
    if (failed) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  const h = cur?.hit;
  const playerHp = h ? h.playerHp : replay.startPlayerHp;
  const foeHp = h ? h.foeHp : replay.startFoeHp;
  const heroPct = (playerHp / Math.max(1, replay.playerMaxHp)) * 100;
  const foePct = (foeHp / Math.max(1, replay.foeMaxHp)) * 100;
  // 每回合輪一門外功：七卷格跟住而家輪到嗰門
  const artNow = replayArtAt(replay, cur ? cur.n - 1 : -1);
  const owned = new Set(artNow.vols);
  const moves = artNow.artId ? artVolumeMoves(artNow.artId) : [];
  const artName = artNow.artId ? getSkillDef(artNow.artId)?.name : undefined;

  if (unified) return createPortal(<InkUnifiedBattleFrame
    trait={replay.foeTrait ? <span title={FOE_TRAITS[replay.foeTrait].blurb} aria-label={`${FOE_TRAITS[replay.foeTrait].name}：${FOE_TRAITS[replay.foeTrait].blurb}`}>
      {FOE_TRAITS[replay.foeTrait].glyph} · {FOE_TRAITS[replay.foeTrait].name}{replay.foeTier === 'elite' ? ' · 弱化' : ''}
    </span> : undefined}
    entering={!entered}
    entrance={!entered ? <InkBattleEntrance ready={sceneReady} reduceMotion={reduceMotion} onEntered={() => { enteredRef.current = true; setEntered(true); }} /> : undefined}
    title={replay.title} round={h?.round ?? 1} fast={fast}
    onSpeed={() => { const next = !fast; setFast(next); speedRef.current = next ? 2 : 1; }}
    onSkip={finish} notice={notice}
    hero={{ name: replay.playerName, hp: playerHp, maxHp: replay.playerMaxHp }}
    foe={{ name: replay.foeName, hp: foeHp, maxHp: replay.foeMaxHp }} boss={replay.foeBoss}
    scene={<div className="ink-unified-canvas-host" ref={wrapRef}><canvas ref={canvasRef} /></div>}
    callout={h ? <span key={cur!.n} className={h.side === 'foe' ? 'is-foe' : ''}>
      {h.side === 'player' && h.vol && <i>卷{VOLUME_NUMERALS[h.vol - 1]} ·</i>}{h.moveName}{h.damage <= 0 && !passiveAction(h) ? ' · 落空' : ''}
    </span> : <span>{replay.title}</span>}
    skills={<InkBattleArts artId={artNow.artId} volumes={artNow.vols} rotation={artNow.rotation} activeVolume={h?.side === 'player' ? h.vol : undefined} />}
  />, document.body);

  return createPortal(
    <div className="ink-auto" role="dialog" aria-modal="true" aria-label={`自動交手：${replay.title}`}>
      <div className="ink-auto-card">
        <header className="ink-auto-head">
          <span className="ink-auto-kicker">自動交手 · 第 {h?.round ?? 1} 回合</span>
          <h3>{replay.title}</h3>
          <button type="button" className="ink-auto-skip" onClick={finish}>
            跳過 ›
          </button>
        </header>

        <div className="ink-spar-stage ink-auto-stage" ref={wrapRef}>
          <canvas ref={canvasRef} style={{ width: '100%', height: STAGE_HEIGHT, display: 'block' }} />
          <div className="ink-spar-hud">
            <span className="ink-spar-hud-stage">{replay.playerName}</span>
            <span className="ink-spar-hud-left">{replay.foeBoss ? '首領之戰' : replay.foeName}</span>
          </div>
          <div className="ink-spar-bar ink-spar-bar--hero" ref={heroBarRef} aria-label={`${replay.playerName} 氣血 ${Math.round(playerHp)}`}>
            <div className="ink-spar-bar-inner">
              <InkBrushBar pct={heroPct} tone="jade" className="ink-spar-bar-main" />
              <span className="ink-spar-bar-num">{formatSparNumber(Math.round(playerHp))}</span>
            </div>
          </div>
          <div className={`ink-spar-bar ink-spar-bar--foe${replay.foeBoss ? ' is-boss' : ''}`} ref={foeBarRef} aria-label={`${replay.foeName} 氣血 ${Math.round(foeHp)}`}>
            {replay.foeBoss && (
              <span className="ink-spar-boss-name">
                <em>首領</em>
                <b>{replay.foeName}</b>
              </span>
            )}
            <div className="ink-spar-bar-inner">
              <InkBrushBar pct={foePct} tone="cinnabar" className="ink-spar-bar-main" />
              <span className="ink-spar-bar-num">{formatSparNumber(Math.round(foeHp))}</span>
            </div>
          </div>
          {/* 出招題字：卷幾・招名（敵人出手就題敵招） */}
          <div className="ink-auto-callout" ref={calloutRef} aria-live="polite">
            {h && (
              <span key={cur!.n} className={`ink-auto-callout-inner is-${h.side}${h.damage <= 0 && !passiveAction(h) ? ' is-miss' : ''}`}>
                {h.side === 'player' && h.vol ? <i>卷{VOLUME_NUMERALS[h.vol - 1]}</i> : null}
                <b>{h.moveName}</b>
                {h.damage <= 0 && !passiveAction(h) ? <small>落空</small> : null}
              </span>
            )}
          </div>
        </div>

        {artNow.artId ? (
          <div className="ink-auto-vols" aria-label={`${artName} 七卷`}>
            {artNow.rotation.length > 1 && (
              <div className="ink-auto-rotation" aria-label="武學輪替">
                {artNow.rotation.map((a) => (
                  <span key={a.id} className={a.id === artNow.artId ? 'is-on' : ''}>
                    {getSkillDef(a.id)?.name}
                  </span>
                ))}
              </div>
            )}
            <p className="ink-auto-vols-title">
              {artName} · 已得 {owned.size}／{VOLUME_COUNT} 卷
            </p>
            <ol>
              {Array.from({ length: VOLUME_COUNT }, (_, k) => k + 1).map((v) => {
                const on = owned.has(v);
                const active = h?.side === 'player' && h.vol === v;
                return (
                  <li key={v} className={`ink-auto-vol${on ? ' is-on' : ''}${active ? ' is-active' : ''}`}>
                    <b>卷{VOLUME_NUMERALS[v - 1]}</b>
                    <span>{on ? moves[v - 1]?.name : '未得'}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <p className="ink-note">尚未學習外功，僅可使用基本攻擊。</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
