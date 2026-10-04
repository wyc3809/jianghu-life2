/**
 * 切磋演武台：主畫面千燈鎮之下嘅主動畫（長血條對打版）。
 * 每關＝幾個小兵＋一個長血條首領；俠客同敵人你一刀我一刀，彈傷害／暴擊／吸血數字，
 * 首領倒下過關掉銅錢（銀兩＋修為）；主角演武血條打光就敗退一關、回滿血再戰（唔傷真氣血）。
 * 數值同關卡由 core/life/sparDuel.ts 話事；引擎淨係播動畫，血條係 DOM 浮層（墨筆血條）。
 * 每擊中一次仍經 store.sparStrike() 加修為，底部大圓圈嘅修為數字會自己滾動。
 *
 * 武器連動：讀裝備欄 equipment.weapon → getGearDef → weaponKind，
 * 對應 WEAPON_SPRITES 嘅貼圖；換裝備即換樣，冇裝備就空手。
 *
 * 換時裝：整一套新 SparSkin 傳入 skin prop（骨架座標要同默認一致）。
 * 換敵人：傳另一個 EnemyDef 池入 enemies prop（每款＝單圖＋腳底錨點＋眼位）。
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SparStage, loadSparImages, loadSparImage, loadSparUiImages, type SparCombatHooks } from '../../spar/engine';
import { SparDuel, sparHeroStats, sparSavedStage, type SparDuelSnapshot } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';
import {
  ENEMY_POOL,
  WEAPON_SPRITES,
  SPAR_BACKGROUNDS,
  SPAR_DEFAULT_BACKGROUND,
  rigForSect,
  type EnemyDef,
  type AnyWarriorRig,
} from '../../spar/rig';
import { getGearDef } from '@data/equipment/catalog';
import { useLifeStore } from '../../store/lifeStore';

interface Props {
  reduceMotion?: boolean;
  skin?: AnyWarriorRig;
  /** 出敵池：每次入場隨機抽一款 */
  enemies?: EnemyDef[];
  /** 場景背景 key（SPAR_BACKGROUNDS），日後可以按地點切換 */
  background?: string;
  /** 浮層內容（例如季節・地點名），壓喺 canvas 之上 */
  overlay?: ReactNode;
}

const STAGE_HEIGHT = 218;
const COIN_SRC = `${import.meta.env.BASE_URL || '/'}ink/spar/fx-coin.webp`;
const fmt = (n: number) => Math.max(0, Math.round(n)).toLocaleString('en-US');

/** 演武數值嘅指紋：角色實力一變（升境、換兵器、武學進步）就重算主角數值 */
function useHeroStatsKey() {
  return useLifeStore((s) => {
    const c = s.state?.character;
    if (!c) return '';
    return [c.martial, c.maxHealth, c.cultivation?.tier ?? 0, c.equipment.weapon, c.equipment.armor, c.equipment.accessory].join('|');
  });
}
const NO_CONDITIONS: { id: string; name: string; monthsLeft: number; severity: number }[] = [];

export function InkSparStage({ reduceMotion = false, skin, enemies = ENEMY_POOL, background = SPAR_DEFAULT_BACKGROUND, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<SparStage | null>(null);
  const [failed, setFailed] = useState(false);

  // 對打狀態（純邏輯）＋血條浮層
  const duelRef = useRef<SparDuel | null>(null);
  const [snap, setSnap] = useState<SparDuelSnapshot | null>(null);
  const [clearNote, setClearNote] = useState<string | null>(null);
  const heroBarRef = useRef<HTMLDivElement | null>(null);
  const foeBarRef = useRef<HTMLDivElement | null>(null);
  const statsKey = useHeroStatsKey();

  if (!duelRef.current) {
    const st = useLifeStore.getState().state;
    if (st) duelRef.current = new SparDuel(sparHeroStats(st), sparSavedStage(st));
  }

  // 角色實力變咗：按比例保留血量換新數值
  useEffect(() => {
    const st = useLifeStore.getState().state;
    const duel = duelRef.current;
    if (!st || !duel) return;
    duel.setHero(sparHeroStats(st));
    setSnap(duel.snapshot());
  }, [statsKey]);

  // 門派服裝：冇特別指定 skin 就按角色門派著衫（無門派＝默認浪人裝）
  const sectId = useLifeStore((s) => s.state?.character.sectId ?? null);
  const rig = skin ?? rigForSect(sectId);

  // 而家佩戴緊嘅武器種類（冇裝備 → null 空手）
  const weaponKind = useLifeStore((s) => {
    const id = s.state?.character.equipment.weapon;
    if (!id) return null;
    return getGearDef(id)?.weaponKind ?? null;
  });

  // 身上狀態（流血不止之類）——顯示喺演武台左上角浮層
  const conditions = useLifeStore((s) => s.state?.character.conditions ?? NO_CONDITIONS);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    let stage: SparStage | null = null;
    let raf = 0;
    let last = 0;
    let running = false;
    let visible = true;
    let cancelled = false;

    const sparStrike = useLifeStore.getState().sparStrike;
    const duel = duelRef.current;
    const sync = () => {
      if (duel) setSnap(duel.snapshot());
    };
    let noteTimer: ReturnType<typeof setTimeout> | null = null;
    const combat: SparCombatHooks | undefined = duel
      ? {
          heroStrike: () => {
            const r = duel.heroStrike();
            sync();
            return r;
          },
          foeStrike: () => {
            const r = duel.foeStrike();
            sync();
            return r;
          },
          nextFoe: () => ({ boss: duel.foe?.boss ?? false }),
          foeDefeated: () => {
            const clearedStage = duel.stage;
            const { stageCleared } = duel.advance();
            sync();
            if (!stageCleared) return { coins: 0 };
            const reward = useLifeStore.getState().sparStageClear(clearedStage);
            setClearNote(`第 ${clearedStage} 關 過關　銀兩 +${reward.silver}　修為 +${Math.round(reward.xp)}`);
            if (noteTimer) clearTimeout(noteTimer);
            noteTimer = setTimeout(() => setClearNote(null), 2400);
            return { coins: 6 };
          },
          heroRecovered: () => {
            duel.retreat();
            useLifeStore.getState().sparSetStage(duel.stage);
            setClearNote(`演武敗退　退守第 ${duel.stage} 關`);
            if (noteTimer) clearTimeout(noteTimer);
            noteTimer = setTimeout(() => setClearNote(null), 2000);
            sync();
          },
        }
      : undefined;

    /** 血條跟住頭頂行（直接改 style，唔觸發 React 重繪） */
    const placeBars = () => {
      if (!stage) return;
      const a = stage.getAnchors();
      const w = wrap.clientWidth;
      // 主角血條向左伸、敵人血條向右伸，上下錯開，唔會疊埋
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
          const lift = fb.offsetHeight + 30;
          fb.style.transform = `translate(${left.toFixed(1)}px, ${(a.foeHeadY - lift).toFixed(1)}px)`;
        }
      }
    };

    const frame = (now: number) => {
      if (!stage) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      stage.update(dt);
      stage.render();
      placeBars();
      if (running) raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running || !stage || !visible) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    loadSparImages(rig, enemies)
      .then(async (images) => {
        images.ui = await loadSparUiImages();
        images.coin = await loadSparImage(COIN_SRC).catch(() => null);
        if (cancelled) return;
        stage = new SparStage({
          canvas,
          images,
          rig,
          enemies,
          onStrike: () => sparStrike(),
          combat,
        });
        sync();
        stageRef.current = stage;
        const rect = wrap.getBoundingClientRect();
        stage.resize(rect.width, STAGE_HEIGHT, Math.min(window.devicePixelRatio || 1, 2.5));
        // 掛上開局嗰刻嘅武器
        const kind = (() => {
          const st = useLifeStore.getState().state;
          const id = st?.character.equipment.weapon;
          return id ? getGearDef(id)?.weaponKind ?? null : null;
        })();
        const def = kind ? WEAPON_SPRITES[kind] : null;
        if (def) {
          loadSparImage(def.src)
            .then((img) => { if (!cancelled) stage?.setWeapon(def, img); })
            .catch(() => { /* 武器圖載唔到就空手，唔影響動畫 */ });
        }
        // 場景背景
        const bgDef = SPAR_BACKGROUNDS[background];
        if (bgDef) {
          loadSparImage(bgDef.src)
            .then((img) => { if (!cancelled) { stage?.setBackground(img, bgDef.opacity ?? 1); if (reduceMotion) stage?.render(); } })
            .catch(() => { /* 背景載唔到就用淨色舞台 */ });
        }
        // 先擺好右邊望左敵人；減少動態仍播慢速行過去（唔再凍格，否則好似壞咗）
        stage.setQuiet(reduceMotion);
        stage.settleIntro();
        startLoop();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    const ro = new ResizeObserver(() => {
      if (!stage) return;
      const rect = wrap.getBoundingClientRect();
      stage.resize(rect.width, STAGE_HEIGHT, Math.min(window.devicePixelRatio || 1, 2.5));
      if (reduceMotion) stage.render();
    });
    ro.observe(wrap);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) startLoop();
      else stopLoop();
    });
    io.observe(wrap);

    return () => {
      cancelled = true;
      if (noteTimer) clearTimeout(noteTimer);
      stageRef.current = null;
      stopLoop();
      ro.disconnect();
      io.disconnect();
    };
  }, [reduceMotion, rig, enemies]);

  // 換裝備 → 換武器貼圖
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const def = weaponKind ? WEAPON_SPRITES[weaponKind] : null;
    if (!def) {
      stage.setWeapon(null, null);
      return;
    }
    let cancelled = false;
    loadSparImage(def.src)
      .then((img) => { if (!cancelled) stage.setWeapon(def, img); })
      .catch(() => { /* 載唔到保持現狀 */ });
    return () => { cancelled = true; };
  }, [weaponKind]);

  // 換場景 → 背景淡入淡出
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const bgDef = SPAR_BACKGROUNDS[background];
    let cancelled = false;
    if (!bgDef) {
      stage.setBackground(null);
      return;
    }
    loadSparImage(bgDef.src)
      .then((img) => { if (!cancelled) stage.setBackground(img, bgDef.opacity ?? 1); })
      .catch(() => { /* 保持現狀 */ });
    return () => { cancelled = true; };
  }, [background]);

  if (failed) return null; // 素材載入唔到就靜靜哋隱藏，唔好阻住遊戲

  return (
    <div className="ink-spar-stage" ref={wrapRef} aria-label="切磋演武">
      <canvas ref={canvasRef} style={{ width: '100%', height: STAGE_HEIGHT, display: 'block' }} />
      {overlay}
      {snap && (
        <>
          <div className="ink-spar-hud" aria-live="polite">
            <span className="ink-spar-hud-stage">第 {snap.stage} 關</span>
            <span className="ink-spar-hud-left">
              {snap.foe?.boss ? '首領之戰' : `餘敵 ${snap.minionsLeft + 1}`}
            </span>
          </div>
          <div className="ink-spar-bar ink-spar-bar--hero" ref={heroBarRef} aria-label={`演武氣血 ${fmt(snap.heroHp)}`}>
            <InkBrushBar pct={(snap.heroHp / Math.max(1, snap.heroMaxHp)) * 100} tone="jade" />
            <span className="ink-spar-bar-num">{fmt(snap.heroHp)}</span>
          </div>
          <div
            className={`ink-spar-bar ink-spar-bar--foe${snap.foe?.boss ? ' is-boss' : ''}`}
            ref={foeBarRef}
            aria-label={snap.foe ? `${snap.foe.name} ${fmt(snap.foeHp)}` : undefined}
          >
            {snap.foe?.boss && (
              <span className="ink-spar-boss-name" key={`${snap.stage}-${snap.foe.name}`}>
                <em>首領</em>
                {snap.foe.name}
              </span>
            )}
            <InkBrushBar pct={snap.foe ? (snap.foeHp / Math.max(1, snap.foe.maxHp)) * 100 : 0} tone="cinnabar" />
            <span className="ink-spar-bar-num">{fmt(snap.foeHp)}</span>
          </div>
          {clearNote && <p className="ink-spar-clear-note">{clearNote}</p>}
        </>
      )}
      {conditions.length > 0 && (
        <div className="ink-spar-conditions" aria-label="狀態">
          {conditions.map((cond) => (
            <span key={cond.id} className="ink-spar-condition-chip">
              {cond.name}·{cond.monthsLeft}月
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
