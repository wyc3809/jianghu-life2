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
import { SparDuel, formatSparNumber, sparHeroStats, sparSavedStage, type SparDuelSnapshot } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';
import { inkHop, inkPopIn, inkRevealChars, inkShake, inkTweenVar } from '../../ui/inkMotion';
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
import { FOE_TRAITS } from '@data/foes/traits';
import { useLifeStore } from '../../store/lifeStore';

interface Props {
  reduceMotion?: boolean;
  skin?: AnyWarriorRig;
  /** 出敵池：每次入場隨機抽一款 */
  enemies?: EnemyDef[];
  /** 場景背景 key（SPAR_BACKGROUNDS），日後可以按地點切換 */
  background?: string;
  /** 浮層內容，壓喺 canvas 之上 */
  overlay?: ReactNode;
  /** 左上角題字：日期＋地名（千燈鎮場景用角色所在地，其他場景用場景地名） */
  caption?: { date: string; home: string };
}

const STAGE_HEIGHT = 218;
const COIN_SRC = `${import.meta.env.BASE_URL || '/'}ink/spar/fx-coin.webp`;
/** 演武對打實例快取：元件重新掛載唔會重開一場 */
const DUEL_CACHE = new Map<string, SparDuel>();
const fmt = formatSparNumber;

/** 演武數值嘅指紋：角色實力一變（升境、換兵器、武學進步）就重算主角數值 */
function useHeroStatsKey() {
  return useLifeStore((s) => {
    const c = s.state?.character;
    if (!c) return '';
    return [c.martial, c.maxHealth, c.cultivation?.tier ?? 0, c.equipment.weapon, c.equipment.armor, c.equipment.accessory].join('|');
  });
}
const NO_CONDITIONS: { id: string; name: string; monthsLeft: number; severity: number }[] = [];

/**
 * 血條動效：扣血 → 條震一震、白色殘血延遲追落；回血或換敵人 → 殘血即刻對齊。
 * resetKey 一變（新敵人／新關）唔播扣血效果。
 */
function useBarMotion(
  innerRef: React.RefObject<HTMLDivElement | null>,
  ghostRef: React.RefObject<HTMLSpanElement | null>,
  pct: number,
  resetKey: string,
) {
  const prev = useRef<{ pct: number; key: string } | null>(null);
  useEffect(() => {
    const ghost = ghostRef.current?.querySelector<HTMLElement>('.ink-brush-bar');
    const last = prev.current;
    prev.current = { pct, key: resetKey };
    if (!ghost) return;
    if (!last || last.key !== resetKey || pct >= last.pct) {
      ghost.style.setProperty('--pct', pct.toFixed(2));
      return;
    }
    inkShake(innerRef.current, pct < last.pct - 8 ? 4 : 2.5, 300);
    inkTweenVar(ghost, '--pct', last.pct, pct, { delay: 260, duration: 520 });
  }, [pct, resetKey, innerRef, ghostRef]);
}

export function InkSparStage({ reduceMotion = false, skin, enemies = ENEMY_POOL, background = SPAR_DEFAULT_BACKGROUND, overlay, caption }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<SparStage | null>(null);
  const [failed, setFailed] = useState(false);

  // 對打狀態（純邏輯）＋血條浮層
  const duelRef = useRef<SparDuel | null>(null);
  const [snap, setSnap] = useState<SparDuelSnapshot | null>(null);
  const [clearNote, setClearNote] = useState<string | null>(null);
  const heroBarRef = useRef<HTMLDivElement | null>(null);
  const heroInnerRef = useRef<HTMLDivElement | null>(null);
  const heroGhostRef = useRef<HTMLSpanElement | null>(null);
  const foeInnerRef = useRef<HTMLDivElement | null>(null);
  const foeGhostRef = useRef<HTMLSpanElement | null>(null);
  const bossNameRef = useRef<HTMLElement | null>(null);
  const placeRef = useRef<HTMLDivElement | null>(null);
  const clearNoteRef = useRef<HTMLParagraphElement | null>(null);
  const leftRef = useRef<HTMLSpanElement | null>(null);
  const foeBarRef = useRef<HTMLDivElement | null>(null);
  const statsKey = useHeroStatsKey();
  // 場景跟關數走（每 10 關換）；未有對打資料就用外面傳入嘅背景
  const sceneBg = snap?.sceneBg ?? background;
  const [placeTitle, setPlaceTitle] = useState<{ place: string; n: number } | null>(null);
  const lastSceneRef = useRef<string | null>(null);

  if (!duelRef.current) {
    const st = useLifeStore.getState().state;
    if (st) {
      // 同一世共用一場演武：轉 tab／開事件再返嚟，血量同敵陣接住打
      const key = `${st.seed}:${String(st.character.flags.legacy_generation ?? 1)}:${st.character.name}`;
      let duel = DUEL_CACHE.get(key);
      if (!duel) {
        duel = new SparDuel(sparHeroStats(st), sparSavedStage(st));
        DUEL_CACHE.clear();
        DUEL_CACHE.set(key, duel);
      }
      duelRef.current = duel;
      // 截圖／測試用：DEV 先有
      if (import.meta.env.DEV) (window as unknown as { __sparDuel?: SparDuel }).__sparDuel = duel;
    }
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
    /** 敵人 0 血就換人；過咗關就入賬、出提示。回傳係咪過關 */
    const settleDeadFoe = (): boolean => {
      if (!duel) return false;
      const r = duel.ensureLiveFoe();
      if (!r) return false;
      sync();
      if (!r.stageCleared) return false;
      const reward = useLifeStore.getState().sparStageClear(r.clearedStage);
      setClearNote(`第 ${r.clearedStage} 關 過關　銀兩 +${reward.silver}　修為 +${Math.round(reward.xp)}`);
      if (noteTimer) clearTimeout(noteTimer);
      noteTimer = setTimeout(() => setClearNote(null), 2400);
      return true;
    };
    const combat: SparCombatHooks | undefined = duel
      ? {
          heroStrike: () => {
            settleDeadFoe();
            const r = duel.heroStrike();
            sync();
            return r;
          },
          foeStrike: () => {
            if (duel.foeHp <= 0) return { dmg: 0, heroDown: false, fx: [] };
            const r = duel.foeStrike();
            sync();
            return r;
          },
          nextFoe: () => {
            // 重新載入時可能接住一個已死嘅敵人：先結算換人，先決定出邊個
            settleDeadFoe();
            const f = duel.foe;
            return { boss: f?.boss ?? false, look: f?.look, tier: f?.tier, trait: f?.trait, accent: f?.accent };
          },
          foeCharging: () => duel.foeCharging,
          foeEnraged: () => duel.foeEnraged,
          foeDefeated: () => ({ coins: settleDeadFoe() ? 6 : 0 }),
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
        const bgDef = SPAR_BACKGROUNDS[duel ? duel.snapshot().sceneBg : background];
        lastSceneRef.current = duel ? duel.snapshot().sceneBg : background;
        stage.setAmbience(lastSceneRef.current);
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

  // 換場景 → 背景墨暈淡入淡出＋地名題字＋俠客由左行入
  useEffect(() => {
    const prev = lastSceneRef.current;
    lastSceneRef.current = sceneBg;
    const stage = stageRef.current;
    if (!stage) return;
    const bgDef = SPAR_BACKGROUNDS[sceneBg];
    let cancelled = false;
    stage.setAmbience(sceneBg);
    if (prev !== null && prev !== sceneBg) {
      stage.enterScene();
      if (snap) setPlaceTitle((t) => ({ place: snap.place, n: (t?.n ?? 0) + 1 }));
    }
    if (!bgDef) {
      stage.setBackground(null);
      return;
    }
    loadSparImage(bgDef.src)
      .then((img) => { if (!cancelled) stage.setBackground(img, bgDef.opacity ?? 1); })
      .catch(() => { /* 保持現狀 */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneBg]);

  // 題字顯示兩秒半後收起
  useEffect(() => {
    if (!placeTitle) return;
    const t = setTimeout(() => setPlaceTitle(null), 2600);
    return () => clearTimeout(t);
  }, [placeTitle]);

  // ───── anime.js 浮層動效 ─────
  const heroPct = snap ? (snap.heroHp / Math.max(1, snap.heroMaxHp)) * 100 : 0;
  const foePct = snap?.foe ? (snap.foeHp / Math.max(1, snap.foe.maxHp)) * 100 : 0;
  const foeKey = snap?.foe ? `${snap.stage}|${snap.minionsLeft}|${snap.foe.name}` : '';
  useBarMotion(heroInnerRef, heroGhostRef, heroPct, String(snap?.stage ?? ''));
  useBarMotion(foeInnerRef, foeGhostRef, foePct, foeKey);

  // 首領名：逐字凝聚
  const bossName = snap?.foe?.boss ? `${snap.stage}-${snap.foe.name}` : '';
  useEffect(() => {
    if (!bossName) return;
    return inkRevealChars(bossNameRef.current, { delay: 120, step: 90 }) ?? undefined;
  }, [bossName]);

  // 換景題字：地名逐字、其餘落筆出場
  useEffect(() => {
    const el = placeRef.current;
    if (!placeTitle || !el) return;
    const undo = inkRevealChars(el.querySelector('strong'), { delay: 260, step: 140 });
    inkPopIn(el.querySelectorAll('small, span, em'), { step: 120 });
    return undo ?? undefined;
  }, [placeTitle]);

  // 過關提示、餘敵數字
  useEffect(() => {
    if (clearNote && !placeTitle) inkPopIn(clearNoteRef.current, { y: 8 });
  }, [clearNote, placeTitle]);
  const leftLabel = snap ? (snap.foe?.boss ? 'boss' : String(snap.minionsLeft)) : '';
  useEffect(() => {
    if (leftLabel) inkHop(leftRef.current);
  }, [leftLabel]);

  if (failed) return null; // 素材載入唔到就靜靜哋隱藏，唔好阻住遊戲

  return (
    <div className="ink-spar-stage" ref={wrapRef} aria-label="切磋演武">
      <canvas ref={canvasRef} style={{ width: '100%', height: STAGE_HEIGHT, display: 'block' }} />
      {overlay}
      {caption && (
        <p className="ink-spar-caption">
          <span>{caption.date}</span>
          <strong>{snap && snap.sceneBg !== 'town' ? snap.place : caption.home}</strong>
        </p>
      )}
      {snap && (
        <>
          <div className="ink-spar-hud" aria-live="polite">
            <span className="ink-spar-hud-stage">
              第 {snap.stage} 關 · {snap.theme}
            </span>
            <span className="ink-spar-hud-left" ref={leftRef}>
              {snap.foe?.boss ? '首領之戰' : `餘敵 ${snap.minionsLeft + 1}`}
            </span>
          </div>
          <div className="ink-spar-bar ink-spar-bar--hero" ref={heroBarRef} aria-label={`演武氣血 ${fmt(snap.heroHp)}`}>
            <div className="ink-spar-bar-inner" ref={heroInnerRef}>
              {/* 殘血：扣血後白影慢慢追落 */}
              <span className="ink-spar-bar-ghost" ref={heroGhostRef}>
                <InkBrushBar pct={100} tone="ink" />
              </span>
              <InkBrushBar pct={heroPct} tone="jade" className="ink-spar-bar-main" />
              <span className="ink-spar-bar-num">{fmt(snap.heroHp)}</span>
            </div>
          </div>
          <div
            className={`ink-spar-bar ink-spar-bar--foe${snap.foe?.boss ? ' is-boss' : ''}${snap.foe?.tier === 'elite' ? ' is-elite' : ''}`}
            ref={foeBarRef}
            aria-label={snap.foe ? `${snap.foe.name} ${fmt(snap.foeHp)}` : undefined}
          >
            {snap.foe?.boss && (
              <span className="ink-spar-boss-name" key={`${snap.stage}-${snap.foe.name}`}>
                <em>首領</em>
                <b ref={bossNameRef}>{snap.foe.name}</b>
              </span>
            )}
            {snap.foe?.tier === 'elite' && (
              <span className="ink-spar-boss-name ink-spar-elite-name" key={`${snap.stage}-${snap.minionsLeft}-${snap.foe.name}`}>
                <em>精英</em>
                <b>{snap.foe.name}</b>
              </span>
            )}
            {snap.foe?.trait && (
              <span
                className={`ink-spar-trait${snap.foeCharging ? ' is-charging' : ''}${snap.foeEnraged ? ' is-enraged' : ''}`}
                style={{ ['--trait' as string]: `rgb(${FOE_TRAITS[snap.foe.trait].rgb})` }}
                title={FOE_TRAITS[snap.foe.trait].blurb}
              >
                <i>{FOE_TRAITS[snap.foe.trait].glyph}</i>
                {FOE_TRAITS[snap.foe.trait].name}
                {snap.foe.tier === 'elite' ? '·弱' : ''}
              </span>
            )}
            <div className="ink-spar-bar-inner" ref={foeInnerRef}>
              <span className="ink-spar-bar-ghost" ref={foeGhostRef}>
                <InkBrushBar pct={100} tone="ink" />
              </span>
              <InkBrushBar pct={foePct} tone="cinnabar" className="ink-spar-bar-main" />
              <span className="ink-spar-bar-num">{fmt(snap.foeHp)}</span>
            </div>
          </div>
          {/* 跨場景過關：獎勵併入題字卡，唔好兩個提示疊埋 */}
          {clearNote && !placeTitle && (
            <p className="ink-spar-clear-note" ref={clearNoteRef}>
              {clearNote}
            </p>
          )}
          {placeTitle && (
            <div className="ink-spar-place" key={placeTitle.n} aria-live="polite" ref={placeRef}>
              {clearNote && <small>{clearNote}</small>}
              <span>入</span>
              <strong>{placeTitle.place}</strong>
              <em>{snap.theme}</em>
            </div>
          )}
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
