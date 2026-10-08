import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CombatReplay, CombatReplayHit } from '@interfaces/lifeEngine';
import { getSkillDef } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { VOLUME_COUNT, VOLUME_NUMERALS, artVolumeMoves, replayArtAt } from '@data/skills/volumes';
import { SparStage, loadSparImage, loadSparImages, loadSparUiImages, type SparCombatHooks } from '../../spar/engine';
import { ENEMY_POOL, SPAR_BACKGROUNDS, WEAPON_SPRITES, rigForSect } from '../../spar/rig';
import { formatSparNumber } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';
import { useLifeStore } from '../../store/lifeStore';
import { playInkDefeat, playInkMiss, playInkVictory } from '../../audio/inkAudio';

const STAGE_HEIGHT = 230;
const COIN_SRC = `${import.meta.env.BASE_URL || '/'}ink/spar/fx-coin.webp`;
/** 成場演出最長幾耐（ms）：超時就當播完，唔好卡住玩家——測試參數 */
export const AUTO_BATTLE_MAX_MS = 45_000;

type Props = {
  replay: CombatReplay;
  /** 演完（或者撳跳過） */
  onDone: () => void;
  reduceMotion?: boolean;
};

type Hit = CombatReplayHit & { round: number };

/** 按敵人名揀剪影（首領用鐵面／赤髮大隻款），同一個名每次一樣 */
function foeLook(name: string, boss: boolean): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = boss ? [4, 6] : [1, 2, 3, 5];
  return pool[h % pool.length]!;
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
export function InkAutoBattle({ replay, onDone, reduceMotion = false }: Props) {
  const hits = useMemo<Hit[]>(
    () => replay.rounds.flatMap((r) => r.hits.map((h) => ({ ...h, round: r.round }))),
    [replay],
  );
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
    onDoneRef.current();
  };

  const sectId = useLifeStore((s) => s.state?.character.sectId ?? null);
  const weaponId = useLifeStore((s) => s.state?.character.equipment.weapon ?? null);

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
    const end = (ms: number) => {
      if (ended) return;
      ended = true;
      if (replay.outcome === 'lost') playInkDefeat();
      else if (replay.outcome !== 'ended') playInkVictory();
      endTimer = setTimeout(finish, ms);
    };
    const show = (h: Hit) => {
      setCur({ hit: h, n: i });
      if (h.damage <= 0) playInkMiss();
    };
    const combat: SparCombatHooks = {
      heroMayAttack: () => !ended && hits[i]?.side === 'player',
      foeMayAttack: () => !ended && hits[i]?.side === 'foe',
      heroStrike: () => {
        const h = hits[i];
        if (!h || h.side !== 'player') return { dmg: 0, crit: false, heal: 0, killed: false };
        i += 1;
        show(h);
        const killed = h.foeHp <= 0;
        if (!killed && i >= hits.length) end(1200);
        return { dmg: h.damage, crit: h.damage > 0 && (h.vol ?? 1) >= 5, heal: 0, killed };
      },
      foeStrike: () => {
        const h = hits[i];
        if (!h || h.side !== 'foe') return { dmg: 0, heroDown: false };
        i += 1;
        show(h);
        const heroDown = h.playerHp <= 0;
        if (!heroDown && i >= hits.length) end(1200);
        return { dmg: h.damage, heroDown };
      },
      nextFoe: () => ({ boss: Boolean(replay.foeBoss), look: foeLook(replay.foeName, Boolean(replay.foeBoss)) }),
      foeDefeated: () => {
        end(700);
        return { coins: 6 };
      },
      heroRecovered: () => end(200),
    };

    const placeBars = () => {
      if (!stage) return;
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
      if (!stage || cancelled) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      stage.update(dt);
      stage.render();
      placeBars();
      raf = requestAnimationFrame(frame);
    };

    const rig = rigForSect(sectId);
    loadSparImages(rig, ENEMY_POOL)
      .then(async (images) => {
        images.ui = await loadSparUiImages();
        images.coin = await loadSparImage(COIN_SRC).catch(() => null);
        if (cancelled) return;
        stage = new SparStage({ canvas, images, rig, enemies: ENEMY_POOL, combat });
        const rect = wrap.getBoundingClientRect();
        stage.resize(rect.width, STAGE_HEIGHT, Math.min(window.devicePixelRatio || 1, 2.5));
        const kind = weaponId ? getGearDef(weaponId)?.weaponKind : undefined;
        const wdef = kind ? WEAPON_SPRITES[kind] : null;
        if (wdef) loadSparImage(wdef.src).then((img) => { if (!cancelled) stage?.setWeapon(wdef, img); }).catch(() => {});
        const scene = sceneOf(replay);
        const bg = SPAR_BACKGROUNDS[scene];
        stage.setAmbience(scene);
        if (bg) loadSparImage(bg.src).then((img) => { if (!cancelled) stage?.setBackground(img, bg.opacity ?? 1); }).catch(() => {});
        stage.setQuiet(reduceMotion);
        stage.settleIntro();
        if (!hits.length) end(800);
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    const cap = setTimeout(finish, AUTO_BATTLE_MAX_MS);
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (endTimer) clearTimeout(endTimer);
      clearTimeout(cap);
    };
    // 一場演出一個引擎：replay 變先重開
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay]);

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
              <span key={cur!.n} className={`ink-auto-callout-inner is-${h.side}${h.damage <= 0 ? ' is-miss' : ''}`}>
                {h.side === 'player' && h.vol ? <i>卷{VOLUME_NUMERALS[h.vol - 1]}</i> : null}
                <b>{h.moveName}</b>
                {h.damage <= 0 ? <small>落空</small> : null}
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
          <p className="ink-note">未學外功——只可以用基本攻擊。</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
