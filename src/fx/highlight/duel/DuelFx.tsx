/**
 * 高光級打鬥演出（自動交手）：質素對齊開寶箱／武學令（src/fx/highlight）。
 * Three.js（剪影＋筆觸＋墨霧 shader）＋ GSAP 時間線＋ Canvas 2D 墨點；React.lazy 按需載入。
 * 呢個檔案負責 DOM 圖層：宣紙底、場景、題字、血條、七卷格、傷害數字層、墨暈、勝敗印、跳過／加速。
 * 只讀 CombatReplay，唔改戰鬥結果。
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import type { CombatReplay } from '@interfaces/lifeEngine';
import { getSkillDef } from '@data/skills/catalog';
import { VOLUME_COUNT, VOLUME_NUMERALS, artVolumeMoves, replayArtAt } from '@data/skills/volumes';
import { sealUrlForText } from '../../../ui/inkAssets';
import { playInkBlade, playInkCrit, playInkDefeat, playInkHit, playInkMiss, playInkVictory } from '../../../audio/inkAudio';
import { GRADES } from '../grades';
import { DuelDirector, type DuelHit, type DuelWeapon } from './director';
import { WEAPON_SPRITES } from '../../../spar/rig';
import { HERO_ATK_FRAMES, HERO_SIL, HERO_WEAPON_GRIPS, WEAPON_SIL_LENGTH } from '../../../spar/silhouetteDraw';
import { CRIT_FROM_VOL } from './strokes';
import styles from './duel.module.css';

const BASE = import.meta.env.BASE_URL || '/';
const SIL = `${BASE}ink/spar/sil/`;
const FOE_LOOKS = ['daoke', 'nvcike', 'toutuo', 'gouke'];
const BOSS_LOOKS = ['tiemian', 'chifa'];
const BACKDROPS: Record<string, string> = {
  gate: `${BASE}ink/ai/banners/banner-sect-gate.webp`,
  nightpeak: `${BASE}ink/ai/backdrops/backdrop-night-mountains.webp`,
  road: `${BASE}ink/ai/banners/banner-mountain-road.webp`,
};

/** 霞鶩文楷 TC（同高光時刻一樣嘅毛筆楷書） */
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&display=swap';
function ensureFonts() {
  if (typeof document === 'undefined' || document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = FONT_HREF;
  document.head.appendChild(l);
}

function foeLook(name: string, boss: boolean): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = boss ? BOSS_LOOKS : FOE_LOOKS;
  return pool[h % pool.length]!;
}

function sceneOf(r: CombatReplay): string {
  if (/論劍|華山/.test(r.title)) return 'gate';
  if (r.foeBoss) return 'nightpeak';
  return 'road';
}

/** 逐字凝聚：由化開（大、模糊、淡）收實 */
function useCondense(ref: React.RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const chars = ref.current?.querySelectorAll('span');
    if (!chars?.length) return;
    gsap.fromTo(
      chars,
      { scale: 1.9, y: -14, opacity: 0, filter: 'blur(8px)' },
      { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.42, ease: 'back.out(2)', stagger: 0.05, overwrite: true },
    );
  }, [key, ref]);
}

function Chars({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </>
  );
}

/** 裝備欄兵器 → 打鬥演出用兵器（同演武台 WEAPON_SPRITES／HERO_WEAPON_GRIPS 一致）；空手＝null */
function duelWeapon(kind: string | null | undefined): DuelWeapon | null {
  const def = kind ? WEAPON_SPRITES[kind] : undefined;
  if (!kind || !def) return null;
  return {
    src: def.src,
    w: def.w,
    h: def.h,
    grip: def.grip,
    tip: def.tip,
    length: WEAPON_SIL_LENGTH[kind] ?? 240,
    grips: {
      idle: HERO_WEAPON_GRIPS.idle!,
      windup: HERO_WEAPON_GRIPS['atk-0']!,
      strike: HERO_WEAPON_GRIPS['atk-1']!,
    },
  };
}

export interface DuelFxProps {
  /** 裝備欄兵器種類（sword／blade／spear…）；null＝空手 */
  weaponKind?: string | null;
  replay: CombatReplay;
  onDone: () => void;
  /** Three.js 素材載唔到：上層退返 2D 演出 */
  onFail?: () => void;
}

export default function DuelFx({ replay, onDone, onFail, weaponKind = null }: DuelFxProps) {
  const hits = useMemo<DuelHit[]>(
    () => replay.rounds.flatMap((r) => r.hits.map((h) => ({ ...h, round: r.round }))),
    [replay],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLImageElement>(null);
  const director = useRef<DuelDirector | null>(null);
  const [opened, setOpened] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [shown, setShown] = useState(-1);
  const [finale, setFinale] = useState<'win' | 'lose' | 'end' | null>(null);
  const [fast, setFast] = useState(false);
  const doneRef = useRef(false);
  const cbRef = useRef({ onDone, onFail });
  cbRef.current = { onDone, onFail };
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cbRef.current.onDone();
  };

  useEffect(ensureFonts, []);

  useLayoutEffect(() => {
    const look = foeLook(replay.foeName, Boolean(replay.foeBoss));
    const d = new DuelDirector(
      {
        root: rootRef.current!,
        world: worldRef.current!,
        gl: glRef.current!,
        fx: fxRef.current!,
        numbers: numbersRef.current!,
        wash: washRef.current!,
        fade: fadeRef.current!,
      },
      replay,
      hits,
      {
        // 同演武台一樣嘅剪影（已擦走畫死嘅刀）：待機、蓄勢（atk-0）、揮擊（atk-1）
        heroIdle: HERO_SIL.idle.src,
        heroWindup: HERO_ATK_FRAMES[0].src,
        heroStrike: HERO_ATK_FRAMES[1].src,
        weapon: duelWeapon(weaponKind),
        foe: `${SIL}enemy-${look}.webp`,
        splash: `${BASE}ink/spar/fx-splash.webp`,
      },
      {
        onOpen: () => setOpened(true),
        onBeat: (k) => {
          setBeat(k);
          const h = hits[k];
          if (h?.side === 'player') playInkBlade();
        },
        onImpact: (k) => {
          setShown(k);
          const h = hits[k];
          if (!h) return;
          if (h.damage <= 0) playInkMiss();
          else if (h.side === 'player' && (h.vol ?? 1) >= CRIT_FROM_VOL) playInkCrit();
          else playInkHit();
        },
        onFinale: (kind) => {
          setFinale(kind);
          if (kind === 'win') playInkVictory();
          else if (kind === 'lose') playInkDefeat();
        },
        onDone: finish,
        onFail: () => cbRef.current.onFail?.(),
      },
    );
    director.current = d;
    const ro = new ResizeObserver(() => d.resize());
    ro.observe(rootRef.current!);
    return () => {
      ro.disconnect();
      d.dispose();
      director.current = null;
    };
    // replay 變 → 上層用 key 重新掛載
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 落空嘅招都要更新血條（命中先叫 onImpact；落空喺 beat 開始就當已發生）
  const cur = hits[beat];
  const hpIdx = Math.max(shown, cur && cur.damage <= 0 ? beat : -1);
  const hpHit = hits[hpIdx];
  const playerHp = hpHit ? hpHit.playerHp : replay.startPlayerHp;
  const foeHp = hpHit ? hpHit.foeHp : replay.startFoeHp;

  useCondense(titleRef, opened ? 'open' : 'pre');
  const calloutText = cur ? (cur.side === 'player' && cur.vol ? `卷${VOLUME_NUMERALS[cur.vol - 1]}・${cur.moveName}` : cur.moveName) : '';
  useCondense(calloutRef, `${beat}`);

  // 落印：由大蓋落，輕微回彈
  useLayoutEffect(() => {
    if (!finale || finale === 'end' || !sealRef.current) return;
    gsap.fromTo(sealRef.current, { scale: 3.2, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: -6, duration: 0.42, ease: 'back.out(2.2)' });
  }, [finale]);

  // 每回合輪一門外功：七卷格跟住而家輪到嗰門
  const artNow = replayArtAt(replay, beat);
  const owned = new Set(artNow.vols);
  const moves = artNow.artId ? artVolumeMoves(artNow.artId) : [];
  const artName = artNow.artId ? getSkillDef(artNow.artId)?.name : undefined;
  // 宣紙底：普通凡品紙色，首領泥金暈
  const grade = GRADES[replay.foeBoss ? 4 : 0];
  const sealSrc = finale === 'lose' ? sealUrlForText('敗') : sealUrlForText('勝');

  return createPortal(
    <div
      className={styles.root}
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`自動交手：${replay.title}`}
      style={{ ['--bg-in' as string]: grade.bgInner, ['--bg-out' as string]: grade.bgOuter }}
      onClick={() => finale && finish()}
    >
      <div className={styles.world} ref={worldRef}>
        <img className={styles.backdrop} src={BACKDROPS[sceneOf(replay)]} alt="" draggable={false} />
        <canvas ref={glRef} className={styles.gl} />
        <canvas ref={fxRef} className={styles.fx} />
      </div>
      <div className={styles.wash} ref={washRef} aria-hidden />
      <div className={styles.fade} ref={fadeRef} aria-hidden />
      <div className={styles.numbers} ref={numbersRef} aria-hidden />

      <header className={styles.top}>
        <span className={styles.round}>第 {cur?.round ?? 1} 回合</span>
        <div className={styles.buttons}>
          <button
            type="button"
            className={`${styles.btn}${fast ? ` ${styles.on}` : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              const next = !fast;
              setFast(next);
              director.current?.setSpeed(next ? 2 : 1);
            }}
          >
            加速 ×2
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
          >
            跳過 ›
          </button>
        </div>
      </header>

      {/* 血條：敵上我下 */}
      <div className={`${styles.bar} ${styles.foeBar}`}>
        <b>{replay.foeBoss ? `首領・${replay.foeName}` : replay.foeName}</b>
        <i style={{ ['--fill' as string]: `${(foeHp / Math.max(1, replay.foeMaxHp)) * 100}%` }} />
        <em>
          {Math.round(foeHp)}／{replay.foeMaxHp}
        </em>
      </div>

      <div className={styles.title} ref={titleRef} aria-label={replay.title}>
        {opened && beat < 0 ? <Chars text={replay.title} /> : null}
      </div>
      <div className={styles.callout} ref={calloutRef} aria-live="polite">
        {calloutText ? (
          <div className={`${styles.calloutInner} ${cur?.side === 'foe' ? styles.isFoe : ''}`}>
            <Chars text={calloutText} />
          </div>
        ) : null}
      </div>

      {finale && finale !== 'end' && sealSrc && (
        <img ref={sealRef} className={styles.seal} src={sealSrc} alt={finale === 'win' ? '勝' : '敗'} draggable={false} />
      )}
      {finale === 'end' && <div className={styles.endNote}>收手</div>}

      <footer className={styles.bottom}>
        <div className={`${styles.bar} ${styles.heroBar}`}>
          <b>{replay.playerName}</b>
          <i style={{ ['--fill' as string]: `${(playerHp / Math.max(1, replay.playerMaxHp)) * 100}%` }} />
          <em>
            {Math.round(playerHp)}／{replay.playerMaxHp}
          </em>
        </div>
        {artNow.artId ? (
          <div className={styles.vols} aria-label={`${artName} 七卷`}>
            {artNow.rotation.length > 1 && (
              <div className={styles.rotation} aria-label="武學輪替">
                {artNow.rotation.map((a) => (
                  <span key={a.id} className={a.id === artNow.artId ? styles.on : ''}>
                    {getSkillDef(a.id)?.name}
                  </span>
                ))}
              </div>
            )}
            <p>
              {artName} · 已得 {owned.size}／{VOLUME_COUNT} 卷
            </p>
            <ol>
              {Array.from({ length: VOLUME_COUNT }, (_, k) => k + 1).map((v) => {
                const on = owned.has(v);
                const active = cur?.side === 'player' && cur.vol === v;
                return (
                  <li key={v} className={`${on ? styles.on : ''} ${active ? styles.active : ''}`}>
                    <b>卷{VOLUME_NUMERALS[v - 1]}</b>
                    <span>{on ? moves[v - 1]?.name : '未得'}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <p className={styles.noArt}>未學外功——只可以用基本攻擊。</p>
        )}
      </footer>
    </div>,
    document.body,
  );
}
