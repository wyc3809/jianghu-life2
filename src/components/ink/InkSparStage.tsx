/**
 * 切磋演武台：主畫面千燈鎮之下嘅主動畫（v3 側面圍剿版）。
 * 側身斗笠俠客企台左面向右，敵影由右邊行埋嚟，入射程即揮武器擊殺，
 * 每擊中一次經 store.sparStrike() 加修為，修為一入賬，
 * 底部大圓圈嘅修為數字就會自己滾動（佢睇 committedXp）。
 *
 * 武器連動：讀裝備欄 equipment.weapon → getGearDef → weaponKind，
 * 對應 WEAPON_SPRITES 嘅貼圖；換裝備即換樣，冇裝備就空手。
 *
 * 換時裝：整一套新 SparSkin 傳入 skin prop（骨架座標要同默認一致）。
 * 換敵人：傳另一個 EnemyDef 池入 enemies prop（每款＝單圖＋腳底錨點＋眼位）。
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SparStage, loadSparImages, loadSparImage, loadSparUiImages } from '../../spar/engine';
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
const NO_CONDITIONS: { id: string; name: string; monthsLeft: number; severity: number }[] = [];

export function InkSparStage({ reduceMotion = false, skin, enemies = ENEMY_POOL, background = SPAR_DEFAULT_BACKGROUND, overlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<SparStage | null>(null);
  const [failed, setFailed] = useState(false);

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

    const frame = (now: number) => {
      if (!stage) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      stage.update(dt);
      stage.render();
      if (running) raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running || !stage || reduceMotion || !visible) return;
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
        if (cancelled) return;
        stage = new SparStage({
          canvas,
          images,
          rig,
          enemies,
          onStrike: () => sparStrike(),
        });
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
        // 無論動靜：先擺好右邊望左敵人；減少動態就淨畫一格，否則俠客行過去
        stage.settleIntro();
        if (reduceMotion) {
          stage.update(0);
          stage.render();
        } else {
          startLoop();
        }
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
